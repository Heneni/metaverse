import { Camera, Player, Controls as ControlFactory, Device, Param, Folder, ScriptComponent } from '@oo/scripting'

export default class PlayerControls extends ScriptComponent{

    static config = {
        singleton: true,
    }

    controls: any;

    private _active: boolean = false;

    @Folder("Camera", {})

    @Param({ type: "select", options: ["none", "thirdperson", "firstperson"]})
    mode = "thirdperson";
    @Param({ type: "number", min: 0.1, max: 30, defaultValue: 5 })
    maxZoomOut = 12

    @Param({ options: ["Orbit", "Position"] }) smoothMethod = "Orbit"
    
    @Param({ min: 0, max: 1, step: 0.1 }) smoothFactor = 0.2


    @Folder("Controls", {})

    @Param({ type: "select", options: ["none", "default", "platformer", "platformer2"]})
    controlsMode = "default"

    // DEFAULT
    @Param({ name: "speed", visible: (current) => current.controlsMode === "default", min: 1, max: 100 })
    p_speed = 15
    @Param({ name: "boost", visible: (current) => current.controlsMode === "default", min: 1, max: 3 })
    p_boost = 1.5
    @Param({ name: "acceleration factor", visible: (current) => current.controlsMode === "default", type: "number", min: 0, max: 1 })
    p_accelerationFactor
    @Param({ name: "deceleration factor", visible: (current) => current.controlsMode === "default", type: "number", min: 0, max: 1 })
    p_decelerationFactor
    @Param({ name: "autoAnimate", visible: (current) => current.controlsMode === "default" })
    p_autoAnimate = true
    @Param({ name: "gravity", visible: (current) => current.controlsMode === "default", type: "number", min: -50, max: 0, step: 0.1 })
    p_gravity = -1.81

    @Param({ name: "height", min: 1, max: 100, visible: (current) => current.controlsMode === "default" })
    p_height = 4;
    @Param({ name: "duration", min: 0.3, max: 20, visible: (current) => current.controlsMode === "default" })
    p_duration = 1;
    @Param({ name: "max jumps", min: 1, max: 200, step: 1, visible: (current) => current.controlsMode === "default" })
    p_maxJumps = 1; 
    @Param({ name: "air acceleration", min: 1, max: 3, visible: (current) => current.controlsMode === "default" })
    p_airAcceleration = 1;
    @Param({ name: "hold", visible: (current) => current.controlsMode === "default" })
    p_hold = false;
    @Param({ name: "coyote", min: 0, max: 5, visible: (current) => current.controlsMode === "default" })
    p_coyote = 0.1
    @Param({ name: "max fall speed", min: 1, max: 100, visible: (current) => current.controlsMode === "default" })
    p_maxFallSpeed = 20;
    @Param({ name: "jump peak speed", min: 1, max: 3, visible: (current) => current.controlsMode === "default" })
    p_peakSpeed = 1;
    @Param({ name: "delay to next jump", min: 0, max: 5, visible: (current) => current.controlsMode === "default" })
    p_delay = 0;

    // PLATFORMER PARAMS
    @Param({ visible: (current) => current.controlsMode === "platformer" })
    run = 10
    @Param({ visible: (current) => current.controlsMode === "platformer" })
    jump = 20
    @Param({ visible: (current) => current.controlsMode === "platformer" })
    autoAnimate = true
    @Param({ visible: (current) => current.controlsMode === "platformer", type: "number", min: 0, max: 2 })
    boost = 1.2
    @Param({ visible: (current) => current.controlsMode === "platformer", type: "number", min: -50, max: 0, step: 0.1 })
    gravity = -1.81

    // PLATFORMER 2 PARAMS
    @Param({ visible: (current) => current.controlsMode === "platformer2", min: 0.1, max: 1, step: 0.01 })
    timeToJumpApex = 0.34;

    @Param({ visible: (current) => current.controlsMode === "platformer2", min: 0.1, max: 1, step: 0.01 })
    timeToGround = 0.35;

    @Param({ visible: (current) => current.controlsMode === "platformer2", min: 0.5, max: 50, step: 0.1 })
    jumpAltitude = 6;

    @Param({ visible: (current) => current.controlsMode === "platformer2", min: 0.02, max: 0.2, step: 0.01 })
    highJumpCheckTime = 10;

    @Param({ visible: (current) => current.controlsMode === "platformer2", min: 0.2, max: 2, step: 0.01 })
    timeToHighJumpApex = 0.34;

    @Param({ visible: (current) => current.controlsMode === "platformer2", min: 0.5, max: 50, step: 0.1 })
    highJumpAltitude = 6;

    @Param({ visible: (current) => current.controlsMode === "platformer2", min: 0, max: 10, step: 1 })
    maxJumps = 2;

    @Param({ visible: (current) => current.controlsMode === "platformer2", min: 0, max: 4, step: 0.1 })
    accelerationTime = 0;

    @Param({ visible: (current) => current.controlsMode === "platformer2", min: 0, max: 4, step: 0.1 })
    decelerationTime = 0;

    @Param({ visible: (current) => current.controlsMode === "platformer2", min: 1, max: 50, step: 0.25 })
    walkSpeed = 7;

    @Param({ visible: (current) => current.controlsMode === "platformer2", min: 1, max: 10, step: 0.25 })
    sprintBoost = 4;

    @Param({ visible: (current) => current.controlsMode === "platformer2", min: 10, max: 1000, step: 0.5 })
    maxAcceleration = 1000;

    @Param({ visible: (current) => current.controlsMode === "platformer2", min: 0, max: 0.2, step: 0.01 })
    coyoteTime = 0.1;

    @Param({ visible: (current) => current.controlsMode === "platformer2", min: 0.5, max: 32, step: 0.25 })
    groundFrictionScale = 20;

    @Param({ visible: (current) => current.controlsMode === "platformer2", min: 0.5, max: 8, step: 0.25 })
    groundTractionScale = 1.5;

    @Param({ visible: (current) => current.controlsMode === "platformer2", min: 0, max: 100, step: 0.1 })
    jumpLateDirectionalCorrectionSpeed = 16;

    @Param({ visible: (current) => current.controlsMode === "platformer2", min: 0, max: 100, step: 0.1 })
    airJumpDirectionalSpeed = 24;

    @Param({ visible: (current) => current.controlsMode === "platformer2", min: 0, max: 1000, step: 0.25 })
    airControlMaxLinearVelocity = 275;

    @Param({ visible: (current) => current.controlsMode === "platformer2", min: 0, max: Math.PI * 2 * 10, step: (Math.PI * 2) / 100 })
    airControlAngularVelocity = Math.PI * 2 * 2;

    @Param({ visible: (current) => current.controlsMode === "platformer2", min: 0, max: 4, step: 0.1 })
    maxStepHeight = 1.5;

    @Param({ visible: (current) => current.controlsMode === "platformer2", min: 0.1, max: 2, step: 0.1 })
    minStepWidth = 0.1;

    @Param({ visible: (current) => current.controlsMode === "platformer2", min: 0, max: 2, step: 0.1 })
    snapToGroundHeight = 0.5;

    @Param({ visible: (current) => current.controlsMode === "platformer2" })
    enableSliding = true;

    @Param({ visible: (current) => current.controlsMode === "platformer2", min: 0.1, max: Math.PI / 2, step: Math.PI / 100 })
    maxSlopeClimbAngle = (45 * Math.PI) / 180;

    @Param({ visible: (current) => current.controlsMode === "platformer2", min: 0.1, max: Math.PI / 2, step: Math.PI / 100 })
    minSlopeSlideAngle = (40 * Math.PI) / 180;

    @Param({ visible: (current) => current.controlsMode === "platformer2" })
    applyImpulsesToDynamicBodies = true;

    @Param({ visible: (current) => current.controlsMode === "platformer2", name: "autoAnimate" })
    autoAnimate2 = true;

    @Param({ visible: (current) => current.controlsMode === "platformer2", min: 0, max: 0.25, step: 0.01 })
    orientationSmoothing = 0.08;

    onReady = () => {

        this.initControls()

        this.active = false
    }
    

    get active() {

        return this._active

    }

    set active(val) {

        this._active = val

        if(this.controls) {

            this.controls.active = this._active

            this.controls.showJoystick = this._active && Device.isMobile;

        }
    }
    
    onStart = () => {

        this.active = true

    }


    onUpdate = (dt: number) => {

    }

    onPause = () => {

        this.active = false

    }

    onResume = () => {

        this.active = true

    }

    onEnd = () => {

        this.active = false

        if (!Device.isMobile) {

            document.exitPointerLock()
        }

    }

    onDispose = () => {}


    private initControls() {


        if (this.controlsMode === "default") {

            this.controls = ControlFactory.get({

                type: "default",
                
                object: Player.avatar,
                
                target: Camera,
                
                autoAnimate: this.p_autoAnimate,

                gravity: this.p_gravity,

                run: {

                    maxSpeed: this.p_speed,

                    boost: this.p_boost,

                    accelerationFactor: this.p_accelerationFactor,

                    decelerationFactor: this.p_decelerationFactor,
                },

                jump: {

                    height: this.p_height,

                    duration: this.p_duration,

                    max: this.p_maxJumps,

                    airAcceleration: this.p_airAcceleration,

                    hold: this.p_hold,

                    coyote: this.p_coyote,

                    maxFallSpeed: this.p_maxFallSpeed,

                    peakSpeed: this.p_peakSpeed,

                    delay: this.p_delay,
                }
            })

        } else if ( this.controlsMode === "platformer" ) {

            this.controls = ControlFactory.get({

                type: "platformer",
                
                object: Player.avatar,
                
                target: Camera,
                
                params: {
                
                    run : {
                
                        maxSpeed : this.run,
                
                        boost: this.boost
                
                    },
                
                    jump: {  
                
                        height: this.jump
                
                    },
                
                    autoAnimate: this.autoAnimate
                
                }
            
            })
            
            this.controls.gravity.y = this.gravity
        
        } else if (this.controlsMode === "platformer2") {

            this.controls = ControlFactory.get({

                type: "platformer2",
                
                object: Player.avatar,
                
                target: Camera,
                
                timeToJumpApex: this.timeToJumpApex,

                timeToGround: this.timeToGround,

                jumpAltitude: this.jumpAltitude,

                highJumpCheckTime: this.highJumpCheckTime,

                timeToHighJumpApex: this.timeToHighJumpApex,

                highJumpAltitude: this.highJumpAltitude,

                maxJumps: this.maxJumps,

                accelerationTime: this.accelerationTime,

                decelerationTime: this.decelerationTime,

                walkSpeed: this.walkSpeed,

                sprintBoost: this.sprintBoost,

                maxAcceleration: this.maxAcceleration,

                coyoteTime: this.coyoteTime,

                groundFrictionScale: this.groundFrictionScale,

                groundTractionScale: this.groundTractionScale,

                jumpLateDirectionalCorrectionSpeed: this.jumpLateDirectionalCorrectionSpeed,

                airJumpDirectionalSpeed: this.airJumpDirectionalSpeed,

                airControlMaxLinearVelocity: this.airControlMaxLinearVelocity,

                airControlAngularVelocity: this.airControlAngularVelocity,

                maxStepHeight: this.maxStepHeight,

                minStepWidth: this.minStepWidth,

                snapToGroundHeight: this.snapToGroundHeight,

                enableSliding: this.enableSliding,

                maxSlopeClimbAngle: this.maxSlopeClimbAngle,

                minSlopeSlideAngle: this.minSlopeSlideAngle,

                applyImpulsesToDynamicBodies: this.applyImpulsesToDynamicBodies,

                autoAnimate: this.autoAnimate2,

                orientationSmoothing: this.orientationSmoothing
            
            })
        }

        if( this.mode === "thirdperson" ) {

            Camera.mode =  this.mode
            
            Camera.target = Player.avatar

            Camera.maxZoomOut = this.maxZoomOut

            Camera.controls["smoothMethod"] = this.smoothMethod.toLowerCase();
            
            Camera.controls["smoothFactor"] = this.smoothFactor
        }

        else if( this.mode === "firstperson" ) {

            Camera.mode = "firstperson"

            Camera.target = Player.avatar

        }
    }
}

