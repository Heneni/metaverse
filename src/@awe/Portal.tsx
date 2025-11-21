import { ScriptComponent, Player, Components, Param, Requests, Env, Emitter, Events } from '@oo/scripting'
import { LoopOnce, Object3D, Vector3, Matrix3, Matrix4 } from 'three'

const tempPortalPos = new Vector3()

class PortalsManager {

    pendingPortals = []

    loadingPortals = 0

    destination = null

    readyPortals = []

    currentPortal = null

    entering = false

    inited = false

    label = null

    distance = 10

    constructor() { }

    init = async (destination) => {

        if (this.inited) return;

        this.inited = true;

        this.label = await Components.create({

            type: "interaction",

            distanceTarget: Player.avatar.position,

            distance: this.distance,

            key: "KeyE",

        })

        this.label.scale.set(0, 0, 0);

        this.label.onInteraction((e) => {

            window.open(`/${this.currentPortal.component.instance.destinationSpaceId}?draft=true`, '_blank').focus();

            // gotoGame(this.currentPortal.component.instance.destinationSpaceId);

        })

        this.destination = destination;

        Emitter.on(Events.GAME_UPDATE, this.onUpdate);

        Object.values(this.destination.portals).forEach(({ animations }) => {

            animations.close.forEach(anim => {

                anim.loop = LoopOnce

                anim.play()

            });

        })
    }

    addPortal = (portalData) => {

        this.pendingPortals.push({

            ...portalData,

            createPortal: portalData.createPortal

        });
    }

    onUpdate = (deltaTime) => {

        this.pendingPortals.forEach((portalData) => {

            let position = portalData.position;

            tempPortalPos.set(
                position.x,
                position.y,
                position.z,
            )

            const distance = Player.avatar.position.distanceTo(tempPortalPos);

            if (distance < 100 && this.loadingPortals < 10) {

                this.pendingPortals = this.pendingPortals.filter((p) => p !== portalData);

                this.loadingPortals++;

                portalData.createPortal().then((portal) => {

                    this.readyPortals.push(portal);

                    this.loadingPortals--;

                });
            }

        })

        let _dist = Infinity;

        this.readyPortals.forEach(portal => {

            const distance = Player.avatar.position.distanceTo(portal.component.position)

            portal.component.visible = distance < 200;

            if (distance < _dist) {

                _dist = distance;

                if (portal?.opening && _dist >= 10) {

                    portal.opening = false;

                    this.destination.portalsMixer.stopAllAction()

                    portal.animations.close.forEach(anim => {

                        anim.clampWhenFinished = true

                        anim.loop = LoopOnce

                        anim.play()

                    });
                }

                this.currentPortal = portal;

            }
        })


        if (this.currentPortal?.door) {

            if (_dist < 10 && !this.currentPortal.opening) {

                this.currentPortal.opening = true;

                this.destination.portalsMixer.stopAllAction()

                this.currentPortal.animations.open.forEach(anim => {

                    anim.clampWhenFinished = true

                    anim.loop = LoopOnce

                    anim.play()

                });

            }

        }

        // position label next to portal
        if (this.currentPortal && this.label) {
            this.label.scale.set(.5, .5, .5);

            const worldPosition = new Vector3();

            const offset = new Vector3(
                this.currentPortal.component.instance.component.width / 2,
                0,
                1
            )

            worldPosition.setFromMatrixPosition(new Matrix4().multiplyMatrices(
                this.currentPortal.component.matrixWorld,
                new Matrix4().makeTranslation(offset.x, offset.y, offset.z)
            ));

            this.label.position.copy(worldPosition);
        }
    }
}

const portalManager = new PortalsManager()

export default class Portal extends ScriptComponent {

    static config = {
        transform: true,
    }
    
    mesh: any;

    component = null;

    entering = false;

    destination = null;

    @Param({ visible: () => false })
    destinationMeshTarget = "";

    @Param({ visible: () => false })
    previewImage360 = "";

    @Param({ visible: () => false })
    previewImage = "";

    @Param({ visible: () => false })
    shape = ""

    @Param({ visible: () => false })
    destinationSpaceId = ""

    @Param({ visible: () => false })
    width = 0

    @Param({ visible: () => false })
    height = 0

    async onRenderInit() {

        const [destination] = Components.byType("destination") || [];

        this.destination = destination;


        if (Env?.editMode) {

            await this.createPortal()

        }

    }

    createPortal = async () => {

        if (!this.previewImage360 && !this.previewImage) {

            try {

                const response = await Requests.getOldSpace(this.destinationSpaceId);

                if (response.success) {

                    this.previewImage = response.data.info.cHeroImg;

                    this.previewImage360 = response.data.info.cHeroImg360;

                }
            } catch (err) {

                console.error("Failed to get space data", this.destinationSpaceId)
            }

        }

        this.component = await Components.create({

            height: this.height,

            width: this.width,

            type: "portal",

            shape: this.shape,

            previewImage: {

                "img360": this.previewImage360,

                "img": this.previewImage

            },

            destination: {

                spaceId: this.destinationSpaceId

            },

            destinationMeshTarget: this.destinationMeshTarget,

            collider: {

                rigidbodyType: "FIXED",

                colliderType: "MESH",

                enabled: true,

                sensor: true,

            },

        }, {

            transient: true,

            parent: this

        })

        if (Env?.editMode) return;

        return {

            component: this,

            ...this.destination.portals[this.destinationMeshTarget]
        }

    }

    onGetCollisionMesh() {

        if (this.component) {

            return this.component.getCollisionMesh();

        }
    }

    onRenderUpdate() {}

    onRenderDispose() {

        if (this.component) {

            this.component.destroy();

        }

    }

    static onGetInstanceData(data) {

        const [destination] = Components.byType("destination") || [];

        const targetMesh = destination?.portals?.[data.destinationMeshTarget]?.mesh;

        const bbSize = new Vector3();

        let height = 0

        let width = 0

        let box = null;

        if (!targetMesh) return null;

        targetMesh.updateMatrixWorld()

        targetMesh.geometry.computeBoundingBox()

        targetMesh.geometry.computeVertexNormals()

        box = targetMesh.geometry.boundingBox

        box.getSize(bbSize)

        let arr = [bbSize.x, bbSize.y, bbSize.z]

        arr.sort((a, b) => b - a)

        height = arr[0]

        width = arr[1]

        const obj = new Object3D();

        const meshPos = new Vector3();

        const bbNormalMatrix = new Matrix3();

        box.getCenter(meshPos)

        meshPos.applyMatrix4(targetMesh.matrixWorld)

        obj.position.copy(meshPos)

        const normAttr = targetMesh.geometry.attributes.normal

        let n = new Vector3(normAttr.getX(1), normAttr.getY(1), normAttr.getZ(1))

        n.applyNormalMatrix(bbNormalMatrix.getNormalMatrix(targetMesh.matrixWorld))

        n.add(obj.position)

        obj.lookAt(n)

        targetMesh.parent.remove(targetMesh)

        return {

            width,

            height,

            position: {

                x: obj.position.x,

                y: obj.position.y,

                z: obj.position.z,

            },

            rotation: {

                x: obj.rotation.x,

                y: obj.rotation.y,

                z: obj.rotation.z,

            },

        }
    }

    onStart = () => {

        portalManager.init(this.destination);

        if (this.destinationMeshTarget) {

            const targetMesh = this.destination?.portals?.[this.destinationMeshTarget]?.mesh;

            if (!targetMesh) {

                this.visible = false;

                return;
            }
        }

        portalManager.addPortal({

            createPortal: this.createPortal,

            position: this.position,

        })

    }
}
