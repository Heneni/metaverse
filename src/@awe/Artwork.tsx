import { Vector3, Euler, BoxGeometry, Mesh, MeshBasicMaterial } from 'three'
import { OOOBjects, Components, Param, World, Plugins, ScriptComponent } from '@oo/scripting'
const { InstancedBasicMaterial, InstancedPipelineMesh, InstancedDepthMaterial, InstancedGeometry, InstancedStandardMaterial } = OOOBjects;

const DEPTH = .1;
const BORDER_SIZE = .05;

export default class Artwork extends ScriptComponent {

    static config = {
        transform: true,
    }
    
    mesh: any;

    component = null;

    @Param({ visible: () => false })
    artworkType = ""

    @Param({ visible: () => false })
    url = ""

    @Param
    borderColor = "#000000";

    @Param({ min: 0, max: 1, step: 0.01 })
    borderSize = BORDER_SIZE;

    @Param({ min: 0, max: 1, step: 0.01 })
    opacity = 1;

    @Param
    hasBorder = true;

    @Param({ visible: () => false })
    width = 1

    collisionMesh = null

    border = null;

    height = 1;

    _state: "loading" | "error" | "success" = "loading";

    async onRenderInit() {

        this.loadMedia()
            .then(() => {
                this._state = "success"
            })
            .catch(err => {
                //
                console.error(err)

                this._state = "error";
            })
    }

    async loadMedia() {

        this.component = await Components.create({
        
            url: this.url,
        
            type: this.artworkType,
        
            position: new Vector3(),
        
            rotation: new Euler(),
        
        }, {

            parent: this,
            
            transient: true
        
        });

        let height = 1;

        if (this.artworkType === "image") {

            const scaleRatio =
                this.component._imageFactory._texture.source.data.width /
                this.component._imageFactory._texture.source.data.height; 

            let aspect =
                this.component._imageFactory._texture.source.data.height /
                this.component._imageFactory._texture.source.data.width; 

            height = this.width * aspect;
            
            this.component.scale.set(
                (1 / scaleRatio) * this.width * this.component.data.scale.x,
                height * this.component.data.scale.y,
                1,
            );
            
        } else if (this.artworkType === "video") {

            const aspect =
                this.component.children[0].videoData.video.videoHeight /
                this.component.children[0].videoData.video.videoWidth;

            const scaleRatio =
                this.component.children[0].videoData.video.videoWidth /
                this.component.children[0].videoData.video.videoHeight;

            height = this.width * aspect;

            this.component.scale.set(
                (1 / scaleRatio) * this.width * this.component.data.scale.x,
                height * this.component.data.scale.y,
                1,
            );
        } 

        this.height = height;

        const borderScale = {

            x: this.width * this.component.data.scale.x * (1 + this.borderSize),

            y: this.height * this.component.data.scale.y * (1 + this.borderSize),

            z: 1
        
        }

        this.border = Border.get({
            
            color: this.borderColor,

            attach: this,

            position: this.position,

            rotation: this.rotation,

            scale: borderScale

        })

        this.collisionMesh = new Mesh(
            new BoxGeometry(1, 1, DEPTH),
            new MeshBasicMaterial({ color: 0xff0000 })
        )

        this.collisionMesh.visible = false;

        this.collisionMesh.scale.set(
            borderScale.x,
            borderScale.y,
            borderScale.z,
        )
        
        this.add(this.collisionMesh)

        const INCREMENT = 0.01; // just a small increment to avoid z fighting

        this.component.translateZ(DEPTH / 2 + INCREMENT)        

        this.onRenderUpdate();
    }

    onRenderUpdate() {

        if(this._state !== "success") return;

        this.border.setScale(

            this.scale.x * this.width * this.component.data.scale.x * (1 + this.borderSize),

            this.scale.y * this.height * this.component.data.scale.y * (1 + this.borderSize),

            1

        );

        this.border.setColor(this.borderColor)

        this.border.opacity = this.opacity

        this.border.hasBorder = this.hasBorder == true ? 1.0 : 0.0

    }

  
    onRenderDispose() {
        
        if (this.border ) {

            this.border.visible = false;

            this.border = null;

        }

        if (this.component) {

            this.component.destroy()

            this.component = null
        }

        if (this.collisionMesh) {

            this.collisionMesh.parent.remove(this.collisionMesh);
            
            this.collisionMesh = null
        }
    }

    onGetCollisionMesh() {

        return this.collisionMesh;
    }
}



function BorderPlugin() {

    const VertexPre = `
        varying float front;
        attribute float hasBorder;
       

        #define USE_INSTANCE_COLOR 1.0


        attribute vec3 color;

        vec3 rgb2hsb( in vec3 c ){
            vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
            vec4 p = mix(vec4(c.bg, K.wz),
                        vec4(c.gb, K.xy),
                        step(c.b, c.g));
            vec4 q = mix(vec4(p.xyw, c.r),
                        vec4(c.r, p.yzx),
                        step(p.x, c.r));
            float d = q.x - min(q.w, q.y);
            float e = 1.0e-10;
            return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)),
                        d / (q.x + e),
                        q.x);
        }

        vec3 hsb2rgb( in vec3 c ){
            vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),
                                    6.0)-3.0)-1.0,
                            0.0,
                            1.0 );
            rgb = rgb*rgb*(3.0-2.0*rgb);
            return c.z * mix(vec3(1.0), rgb, c.y);
        }
        `;

    const VertexMain = `

        #ifdef USE_INSTANCE_COLOR

            vColor = icolor;

        #endif

        front = step(0.1, normal.z);

        float back = 1.0 - step(-0.1, normal.z);

        float side = 1.0 - min(1.0, front + back);
    `
    const VertexSuff = `
      

        vec3 hsb = rgb2hsb(icolor);

        if(hsb.z < 0.05) {

            hsb.z = hsb.z + (1.0 - side) * 0.05;
        }
        else {

            hsb.z = hsb.z - hsb.z * side * 0.1;
        }

        vColor = hsb2rgb(hsb);

        // black borderless alpha is front + black when no border
        vOpacity = 1.0 * aOpacity;

        if( hasBorder < 0.5 && front == 1.0) {

            vOpacity = 0.0;
        }

   
    `;

    const FragmentPre = `
        #define USE_COLOR
    `

    return {

        name: "BorderPlugin",

        transparent: true,

        attributes : {

            hasBorder: {

                name: "hasBorder",
                array: [],
                length: 1,
                defaultValue: 1
            },
        },

        fragmentShaderHooks : {

            prefix: FragmentPre
        },

        vertexShaderHooks: {

            prefix: VertexPre,

            main : VertexMain,

            suffix: VertexSuff

        }

    }
}

class BorderFactory {

    mesh = null

    get(_opts) {

        if (this.mesh === null) {

            const baseGeometry = new BoxGeometry(1, 1, DEPTH);

            baseGeometry.computeBoundingSphere();

            const borderPlugin = BorderPlugin()

            const opts = {

                transparent: true,

                color: 0xffffff,

                plugins: [ new Plugins.VISUALS.InstanceOpacityPlugin(), borderPlugin ],

                alphaTest: 0.1

            }

            const diffuseMaterial = new InstancedBasicMaterial(opts)

            const lightingMaterial = new InstancedStandardMaterial(opts)
            
            this.mesh = new InstancedPipelineMesh(

                new InstancedGeometry(baseGeometry, {

                    scale: true,

                    useNormal: true,

                    opacity: true,

                    color: true,

                    rotation: true,

                    boundingSphere: baseGeometry.boundingSphere,

                    name: "border_geometry",
                    
                    plugins: [borderPlugin]

                }),

                diffuseMaterial,

                {
                    
                    visibleOnOcclusion: true,

                    type: "BORDER",

                    lightingMaterial: lightingMaterial,

                },
            );

            this.mesh.customDepthMaterial = new InstancedDepthMaterial();

            this.mesh.castShadow = true;

            this.mesh.receiveShadow = true;  

            World.add(this.mesh);
        }


        const wrapper = this.mesh.add({
            position: _opts.position,
            rotation: _opts.rotation,
            scale: _opts.scale,
        })

        _opts.attach.ignoreScale = true;
        
        wrapper.attachTo(_opts.attach)

        return wrapper;
    }
}

export const Border = new BorderFactory(); 