import { Device, UI, OOUI, World, Emitter, Events, Param, Folder, ScriptComponent } from '@oo/scripting'

export default class Display extends ScriptComponent {

    public root: ReturnType<typeof UI["getRoot"]> | null = null;

    private isPaused = false;
    platform = Device.isMobile ? "mobile" : "desktop";

    @Folder("Actions - Desktop", {})
    @Param({ name: "Start" })
    desktopStartAction = "Click to start!"

    @Param({ name: "Restart" })
    desktopRestartAction = "Click to start again!"

    @Folder("Actions - Mobile", {})
    @Param({ name: "Start" })
    mobileStartAction = "Tap to start!"

    @Param({ name: "Restart" })
    mobileRestartAction = "Tap to start again!"

    @Folder("Leaderboard", {})
    @Param({ name: "Show Leaderboard" })
    showLeaderboard = true;

    startAction = {
        mobile: { title: "", image: "click-tap" },
        desktop: { title: "", image: "space-bar" }
    }

    restartAction = {
        mobile: { title: "", image: "click-tap" },
        desktop: { title: "", image: "space-bar" }
    }

    onMouseDown = async (event) => {
        this.restart();
        Emitter.off(Events.MOUSE_DOWN, this.onMouseDown);
    }

    async restart() {
        const restartFn = this.isPaused ? () => World.resume() : () => World.start();

        if (this.isPaused) {
            this.isPaused = false;
        } else {
            OOUI.navbar.lighten = false;
            OOUI.navbar.custom = {
                ...OOUI.navbar?.custom,
                icon: "v1700011815/golden_star",
            };
        }

        OOUI.currentScreen = "gamescreen";
        restartFn();
    }

    setupStartEvent() {
        Emitter.on(Events.MOUSE_DOWN, this.onMouseDown);
    }

    onPreload = async () => {
        this.startAction.desktop.title = this.desktopStartAction;
        this.startAction.mobile.title = this.mobileStartAction;
        this.restartAction.desktop.title = this.desktopRestartAction;
        this.restartAction.mobile.title = this.mobileRestartAction;
    }

    onReady = async () => {
        this.root = UI.getRoot?.() ?? null;
        OOUI.menu.indicator = this.startAction[this.platform];
        this.setupStartEvent();
    }

    onStart = () => {
        if (this.root) this.root.render(null);

        OOUI.navbar.custom = {
            ...OOUI.navbar?.custom,
            icon: "v1700011815/golden_star",
        };
    }

    onEnd = (data?: any) => {
        const score = data?.score || 0;

        if (this.root) this.root.render(null);
        if (!this.showLeaderboard) return;

        OOUI.navbar.lighten = true;

        let isNewHighScore = false;
        if (score > OOUI.score.best) {
            isNewHighScore = true;
            OOUI.score.best = score;
        }

        OOUI.endgame.isNewBestScore = isNewHighScore;
        OOUI.score.current = score;
        OOUI.endgame.instruction = this.restartAction[this.platform].title;
        OOUI.currentScreen = "endscreen";
        this.setupStartEvent();
    }

    onPause = () => {
        if (this.root) this.root.render(null);
        this.isPaused = true;
    }

    onResume = () => {
        this.setupStartEvent();
    }

    onDispose = () => {
        if (this.root) this.root.render(null);
    }
}