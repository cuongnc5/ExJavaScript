'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _threeModule = require('https://unpkg.com/three@0.109.0/build/three.module.js');

var THREE = _interopRequireWildcard(_threeModule);

var _mat = require('https://unpkg.com/gl-matrix@3.1.0/esm/mat4.js');

var mat4 = _interopRequireWildcard(_mat);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _mapboxgl = mapboxgl,
    MercatorCoordinate = _mapboxgl.MercatorCoordinate;


mapboxgl.accessToken = 'pk.eyJ1IjoiYml6dmVyc2UiLCJhIjoiY2t3cHJqYmY3MDE1cjJ3bXR0NmlmOHhvNCJ9.2xOU_vvbkuvnlxqogSWWHQ';
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v9',
    center: [-74.0445, 40.6892],
    zoom: 16,
    pitch: 60,
    bearing: 120
});

var BoxCustomLayer = function () {
    function BoxCustomLayer(id) {
        _classCallCheck(this, BoxCustomLayer);

        this.type = 'custom';
        this.renderingMode = '3d';
        this.id = id;
        THREE.Object3D.DefaultUp.set(0, 0, 1);
    }

    _createClass(BoxCustomLayer, [{
        key: 'onAdd',
        value: function () {
            var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(map, gl) {
                var centerLngLat, _center, x, y, z;

                return regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                this.camera = new THREE.PerspectiveCamera(28, window.innerWidth / window.innerHeight, 0.1, 1e6);
                                // this.camera = new THREE.Camera();

                                centerLngLat = map.getCenter();

                                this.center = MercatorCoordinate.fromLngLat(centerLngLat, 0);
                                _center = this.center, x = _center.x, y = _center.y, z = _center.z;
                                // const s = 1 / this.center.meterInMercatorCoordinateUnits();

                                this.cameraTransform = new THREE.Matrix4().makeTranslation(x, y, z).scale(new THREE.Vector3(1, -1, 1));
                                // .scale(new THREE.Vector3(s, s, s));

                                this.map = map;
                                this.scene = this.makeScene();

                                // use the Mapbox GL JS map canvas for three.js
                                this.renderer = new THREE.WebGLRenderer({
                                    canvas: map.getCanvas(),
                                    context: gl,
                                    antialias: true
                                });

                                this.renderer.autoClear = false;

                                this.raycaster = new THREE.Raycaster();

                            case 10:
                            case 'end':
                                return _context.stop();
                        }
                    }
                }, _callee, this);
            }));

            function onAdd(_x, _x2) {
                return _ref.apply(this, arguments);
            }

            return onAdd;
        }()
    }, {
        key: 'makeScene',
        value: function makeScene() {
            var scene = new THREE.Scene();
            var skyColor = 0xb1e1ff; // light blue
            var groundColor = 0xb97a20; // brownish orange

            scene.add(new THREE.AmbientLight(0xffffff, 0.25));
            scene.add(new THREE.HemisphereLight(skyColor, groundColor, 0.25));

            var directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
            directionalLight.position.set(-70, -70, 100).normalize();
            // Directional lights implicitly point at (0, 0, 0).
            scene.add(directionalLight);

            var group = new THREE.Group();
            group.name = '$group';
            // The models are all in meter coordinates. This shifts them to Mapbox world coordinates.
            // group.matrix.multiply(this.cameraTransform);
            group.scale.setScalar(this.center.meterInMercatorCoordinateUnits());
            group.updateMatrix();

            // const inv = new THREE.Matrix4();
            // inv.getInverse(this.cameraTransform);
            // group.matrix.premultiply(inv);
            // group.matrixAutoUpdate = false;
            group.applyMatrix(this.cameraTransform);

            var geometry = new THREE.BoxGeometry(100, 100, 100);
            geometry.translate(0, 0, 50);
            var material = new THREE.MeshPhongMaterial({
                color: 0xff0000
            });
            var cube = new THREE.Mesh(geometry, material);

            group.add(cube);
            scene.add(group);

            console.log(scene);

            return scene;
        }
    }, {
        key: 'render',
        value: function render(gl, viewProjectionMatrix) {
            var transform = this.map.transform;
            var camera = this.camera;

            var projectionMatrix = new Float64Array(16),
                projectionMatrixI = new Float64Array(16),
                viewMatrix = new Float64Array(16),
                viewMatrixI = new Float64Array(16);

            // from https://github.com/mapbox/mapbox-gl-js/blob/master/src/geo/transform.js#L556-L568
            var halfFov = transform._fov / 2;
            var groundAngle = Math.PI / 2 + transform._pitch;
            var topHalfSurfaceDistance = Math.sin(halfFov) * transform.cameraToCenterDistance / Math.sin(Math.PI - groundAngle - halfFov);
            var furthestDistance = Math.cos(Math.PI / 2 - transform._pitch) * topHalfSurfaceDistance + transform.cameraToCenterDistance;
            var farZ = furthestDistance * 1.01;

            mat4.perspective(projectionMatrix, transform._fov, transform.width / transform.height, 1, farZ);
            mat4.invert(projectionMatrixI, projectionMatrix);
            mat4.multiply(viewMatrix, projectionMatrixI, viewProjectionMatrix);
            mat4.invert(viewMatrixI, viewMatrix);

            camera.projectionMatrix = new THREE.Matrix4().fromArray(projectionMatrix);

            camera.matrix = new THREE.Matrix4().fromArray(viewMatrixI);
            camera.matrix.decompose(camera.position, camera.quaternion, camera.scale);

            var prod = camera.matrix.clone();
            prod.multiply(camera.projectionMatrix);
            console.log(prod.elements);
            console.log(viewProjectionMatrix);

            // console.log(camera.position)
            // camera.projectionMatrix = new THREE.Matrix4().fromArray(viewProjectionMatrix);
            // camera.matrix = new THREE.Matrix4();
            // camera.matrix.decompose(camera.position, camera.quaternion, camera.scale);

            this.renderer.state.reset();
            this.renderer.render(this.scene, camera);
        }
    }, {
        key: 'raycast',
        value: function raycast(point) {
            var mouse = new THREE.Vector2();
            // scale mouse pixel position to a percentage of the screen's width and height
            mouse.x = point.x / this.map.transform.width * 2 - 1;
            mouse.y = 1 - point.y / this.map.transform.height * 2;

            this.raycaster.setFromCamera(mouse, this.camera);
            // calculate objects intersecting the picking ray
            var intersects = this.raycaster.intersectObjects(this.scene.children, true);
            if (intersects.length) {
                console.log(intersects);
            }
        }
    }]);

    return BoxCustomLayer;
}();

var boxLayer = new BoxCustomLayer('box');

map.on('load', function () {
    map.addLayer(boxLayer);
});

map.on('click', function (e) {
    boxLayer.raycast(e.point);
});
