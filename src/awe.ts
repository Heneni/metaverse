import { Device, World, Emitter, Events } from "@oo/scripting";

export default class Game {
    constructor() {}

    async onPreload() {
        console.log("Game: preload");
        // ✅ Preload assets or setup references here
    }

    async onReady() {
        console.log("Game: ready");

        // ✅ Auto-start on mobile without needing pointer or tap logic
        if (Device.isMobile) {
            console.log("Detected mobile — starting automatically");
            World.start();
        } else {
            console.log("Desktop detected — waiting for UI or user input");
            // If you use DisplayManager, it’ll start via Display
        }

        // ✅ Optional: Auto-optimize all colliders (commented out by default)
        /*
        const objects = World.getAllComponents()
        for (const obj of objects) {
            if (obj.collider) {
                obj.useOctree = true
                obj.rigidBodyType = "FIXED"
                obj.colliderType = "MESH"
            }
        }
        */
    }

    async onStart() {
        console.log("Game: start");
        // ✅ Add per-play logic here
    }

    onUpdate(dt: number) {
        // ✅ Per-frame update logic (optional)
    }

    async onPause() {
        console.log("Game: pause");
    }

    async onResume() {
        console.log("Game: resume");
    }

    async onEnd() {
        console.log("Game: end");
    }

    async onDispose() {
        console.log("Game: dispose");
    }
}
