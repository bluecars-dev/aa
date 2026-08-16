/*
 * Tinybit Extension for micro:bit (PRO VERSION: Consolidated & Stall-Proof)
 * Copyright (C): 2010-2019, Shenzhen Yahboom Tech
 */

//% color="#006400" weight=20 icon="\uf1b9" block="Tinybit"
namespace Tinybit {

    const PWM_ADD = 0x01;
    const MOTOR_REG = 0x02;
    const RGB_REG = 0x01;

    // Hardware Deadband Limits: 50 is the lowest PWM where motors actually spin.
    const MIN_PWM = 50; 
    const MAX_PWM = 255;

    const bufMotor = pins.createBuffer(5);
    const bufRGB = pins.createBuffer(4);

    let yahStrip: neopixel.Strip = null;
    let linePinsInitialized = false;

    export enum enColor {
        //% block="OFF"
        OFF = 0,
        //% block="Red"
        Red,
        //% block="Green"
        Green,
        //% block="Blue"
        Blue,
        //% block="White"
        White,
        //% block="Cyan"
        Cyan,
        //% block="Pinkish"
        Pinkish,
        //% block="Yellow"
        Yellow
    }

    export enum enMusic {
        //% block="dadadum"
        dadadum = 0,
        //% block="entertainer"
        entertainer,
        //% block="nyan"
        nyan,
        //% block="ringtone"
        ringtone,
        //% block="blues"
        blues,
        //% block="chase"
        chase,
        //% block="jump up"
        jump_up,
        //% block="power down"
        power_down
    }

    export enum enPos {
        //% block="Left"
        LeftState = 0,
        //% block="Right"
        RightState = 1
    }

    export enum enLineState {
        //% block="White"
        White = 0,
        //% block="Black"
        Black = 1
    }

    export enum CarState {
        //% block="Run forward"
        Car_Run = 1,
        //% block="Move backward"
        Car_Back = 2,
        //% block="Turn left"
        Car_Left = 3,
        //% block="Turn right"
        Car_Right = 4,
        //% block="Spin left"
        Car_SpinLeft = 6,
        //% block="Spin right"
        Car_SpinRight = 7,
        //% block="Stop"
        Car_Stop = 5
    }

    /**
     * Maps a 0-100% speed value to the usable PWM range, bypassing motor stall zones.
     */
    function calculateUsablePWM(percent: number): number {
        if (percent === 0) return 0;
        percent = Math.clamp(-100, 100, percent);
        let isNegative = percent < 0;
        let absPercent = Math.abs(percent);
        let pwm = MIN_PWM + ((absPercent - 1) * (MAX_PWM - MIN_PWM) / 99);
        return isNegative ? -Math.round(pwm) : Math.round(pwm);
    }

    //% block="set left motor %sp_L \\% right motor %sp_R \\%"
    //% tooltip="Directly control the speed of left and right motors (-100% to 100%)."
    //% color="#006400" weight=87 blockGap=10
    //% sp_L.min=-100 sp_L.max=100 sp_R.min=-100 sp_R.max=100
    export function car_sport(sp_L: number, sp_R: number): void {
        let leftPWM = calculateUsablePWM(sp_L);
        let rightPWM = calculateUsablePWM(sp_R);

        bufMotor[0] = MOTOR_REG;

        // Left motor
        if (leftPWM < 0) { bufMotor[1] = 0; bufMotor[2] = Math.abs(leftPWM); } 
        else { bufMotor[1] = leftPWM; bufMotor[2] = 0; }

        // Right motor
        if (rightPWM < 0) { bufMotor[3] = 0; bufMotor[4] = Math.abs(rightPWM); } 
        else { bufMotor[3] = rightPWM; bufMotor[4] = 0; }

        pins.i2cWriteBuffer(PWM_ADD, bufMotor);
    }

    //% block="car move %index at %speed \\% speed"
    //% tooltip="Move the car in a specific direction at a percentage speed (0-100%)."
    //% weight=92 blockGap=10 speed.min=0 speed.max=100 color="#006400"
    export function CarCtrlSpeed(index: CarState, speed: number): void {
        switch (index) {
            case CarState.Car_Run: car_sport(speed, speed); break;
            case CarState.Car_Back: car_sport(-speed, -speed); break;
            case CarState.Car_Left: car_sport(0, speed); break;
            case CarState.Car_Right: car_sport(speed, 0); break;
            case CarState.Car_SpinLeft: car_sport(-speed, speed); break;
            case CarState.Car_SpinRight: car_sport(speed, -speed); break;
            case CarState.Car_Stop: car_sport(0, 0); break;
        }
    }

    function setPwmRGB(red: number, green: number, blue: number): void {
        bufRGB[0] = RGB_REG;
        bufRGB[1] = Math.clamp(0, 255, red);
        bufRGB[2] = Math.clamp(0, 255, green);
        bufRGB[3] = Math.clamp(0, 255, blue);
        pins.i2cWriteBuffer(PWM_ADD, bufRGB);
    }

    //% block="Tinybit NeoPixel LEDs"
    //% weight=99 blockGap=10 color="#006400"
    export function RGB_Car_Program(): neopixel.Strip {
        if (!yahStrip) {
            yahStrip = neopixel.create(DigitalPin.P12, 2, NeoPixelMode.RGB);
        }
        return yahStrip;
    }

    //% block="set car LEDs to color %value"
    //% weight=98 blockGap=10 color="#006400"
    export function RGB_Car_Big(value: enColor): void {
        switch (value) {
            case enColor.OFF: setPwmRGB(0, 0, 0); break;
            case enColor.Red: setPwmRGB(255, 0, 0); break;
            case enColor.Green: setPwmRGB(0, 255, 0); break;
            case enColor.Blue: setPwmRGB(0, 0, 255); break;
            case enColor.White: setPwmRGB(255, 255, 255); break;
            case enColor.Cyan: setPwmRGB(0, 255, 255); break;
            case enColor.Pinkish: setPwmRGB(255, 0, 255); break;
            case enColor.Yellow: setPwmRGB(255, 255, 0); break;
        }
    }

    //% block="set car LEDs to R: %r G: %g B: %b"
    //% weight=97 blockGap=10 color="#006400"
    //% r.min=0 r.max=255 g.min=0 g.max=255 b.min=0 b.max=255
    export function RGB_Car_Big2(r: number, g: number, b: number): void {
        setPwmRGB(r, g, b);
    }

    //% block="play car melody %index"
    //% weight=95 blockGap=10 color="#006400"
    export function Music_Car(index: enMusic): void {
        // Condensed music list for cleaner UI. Feel free to add the others back if you use them.
        let melody = Melodies.Dadadadum;
        switch (index) {
            case enMusic.entertainer: melody = Melodies.Entertainer; break;
            case enMusic.nyan: melody = Melodies.Nyan; break;
            case enMusic.ringtone: melody = Melodies.Ringtone; break;
            case enMusic.blues: melody = Melodies.Blues; break;
            case enMusic.chase: melody = Melodies.Chase; break;
            case enMusic.jump_up: melody = Melodies.JumpUp; break;
            case enMusic.power_down: melody = Melodies.PowerDown; break;
        }
        music.beginMelody(music.builtInMelody(melody), MelodyOptions.Once);
    }

    //% block="%direct line sensor detects %value line"
    //% tooltip="Returns true/false for line tracking logic."
    //% weight=89 blockGap=10 color="#006400"
    export function Line_Sensor(direct: enPos, value: enLineState): boolean {
        if (!linePinsInitialized) {
            pins.setPull(DigitalPin.P13, PinPullMode.PullNone);
            pins.setPull(DigitalPin.P14, PinPullMode.PullNone);
            linePinsInitialized = true;
        }
        const pin = (direct === enPos.LeftState) ? DigitalPin.P13 : DigitalPin.P14;
        return pins.digitalReadPin(pin) === value;
    }

    //% block="sound sensor volume"
    //% tooltip="Returns raw analog volume (0-1023)."
    //% weight=88 blockGap=10 color="#006400"
    export function Voice_Sensor(): number {
        return pins.analogReadPin(AnalogPin.P1);
    }

    //% block="ultrasonic distance (cm)"
    //% tooltip="Optimized, non-blocking ultrasonic ping."
    //% color="#006400" weight=87 blockGap=10
    export function Ultrasonic_Car(): number {
        pins.setPull(DigitalPin.P16, PinPullMode.PullNone);
        pins.digitalWritePin(DigitalPin.P16, 0);
        control.waitMicros(2);
        pins.digitalWritePin(DigitalPin.P16, 1);
        control.waitMicros(10);
        pins.digitalWritePin(DigitalPin.P16, 0);

        const duration = pins.pulseIn(DigitalPin.P15, PulseValue.High, 17400);
        if (duration === 0) return 0;
        return Math.floor(duration / 58);
    }
}


// MakerBit blocks supporting a Keyestudio Infrared Wireless Module Kit
// (receiver module + remote controller)

const enum IrButton {
    //% block="any"
    Any = -1,
    Power = 0x0,
    Up = 128,
    Left = 32,
    Right = 96,
    Down = 144,
    Light = 64,
    BEEP = 160,
    Plus = 48,
    Minus = 112, 
    TLeft = 16,
    TRight = 80,
    NUM0 = 176,
    NUM1 = 8,
    NUM2 = 136,
    NUM3 = 72,
    NUM4 = 40,
    NUM5 = 168,
    NUM6 = 104,
    NUM7 = 24,
    NUM8 = 152,
    NUM9 = 88
}

const enum IrButtonAction {
    //% block="pressed"
    Pressed = 0,
    //% block="released"
    Released = 1,
}

const enum IrProtocol {
    //% block="Keyestudio"
    Keyestudio = 0,
    //% block="NEC"
    NEC = 1,
}

//% weight=10 color=#008B00 icon="\uf1eb" block="Yahboom_IR_V2"
namespace makerbit {
    let irState: IrState;

    const IR_REPEAT = 256;
    const IR_INCOMPLETE = 257;
    const IR_DATAGRAM = 258;

    const REPEAT_TIMEOUT_MS = 120;

    interface IrState {
        protocol: IrProtocol;
        hasNewDatagram: boolean;
        bitsReceived: number;
        addressSectionBits: number;
        commandSectionBits: number;
        hiword: number;
        loword: number;
        activeCommand: number;
        repeatTimeout: number;
        onIrButtonPressed: IrButtonHandler[];
        onIrButtonReleased: IrButtonHandler[];
        onIrDatagram: () => void;
    }

    class IrButtonHandler {
        irButton: IrButton;
        onEvent: () => void;

        constructor(irButton: IrButton, onEvent: () => void) {
            this.irButton = irButton;
            this.onEvent = onEvent;
        }
    }

    function appendBitToDatagram(bit: number): number {
        irState.bitsReceived += 1;

        if (irState.bitsReceived <= 8) {
            irState.hiword = (irState.hiword << 1) + bit;
            if (irState.protocol === IrProtocol.Keyestudio && bit === 1) {
                irState.bitsReceived = 9;
                irState.hiword = 1;
            }
        } else if (irState.bitsReceived <= 16) {
            irState.hiword = (irState.hiword << 1) + bit;
        } else if (irState.bitsReceived <= 32) {
            irState.loword = (irState.loword << 1) + bit;
        }

        if (irState.bitsReceived === 32) {
            irState.addressSectionBits = irState.hiword & 0xffff;
            irState.commandSectionBits = irState.loword & 0xffff;
            return IR_DATAGRAM;
        } else {
            return IR_INCOMPLETE;
        }
    }

    function decode(markAndSpace: number): number {
        if (markAndSpace < 1600) {
            return appendBitToDatagram(0);
        } else if (markAndSpace < 2700) {
            return appendBitToDatagram(1);
        }

        irState.bitsReceived = 0;

        if (markAndSpace < 12500) {
            return IR_REPEAT;
        } else {
            return IR_INCOMPLETE;
        }
    }

    function enableIrMarkSpaceDetection(pin: DigitalPin) {
        pins.setPull(pin, PinPullMode.PullNone);

        let mark = 0;
        let space = 0;

        pins.onPulsed(pin, PulseValue.Low, () => {
            mark = pins.pulseDuration();
        });

        pins.onPulsed(pin, PulseValue.High, () => {
            space = pins.pulseDuration();
            const status = decode(mark + space);

            if (status !== IR_INCOMPLETE) {
                handleIrEvent(status);
            }
        });
    }

    function handleIrEvent(irEvent: number) {
        if (irEvent === IR_DATAGRAM || irEvent === IR_REPEAT) {
            irState.repeatTimeout = input.runningTime() + REPEAT_TIMEOUT_MS;
        }

        if (irEvent === IR_DATAGRAM) {
            irState.hasNewDatagram = true;

            if (irState.onIrDatagram) {
                background.schedule(irState.onIrDatagram, background.Thread.UserCallback, background.Mode.Once, 0);
            }

            const newCommand = irState.commandSectionBits >> 8;

            if (newCommand !== irState.activeCommand) {
                if (irState.activeCommand >= 0) {
                    const releasedHandler = irState.onIrButtonReleased.find(h => h.irButton === irState.activeCommand || IrButton.Any === h.irButton);
                    if (releasedHandler) {
                        background.schedule(releasedHandler.onEvent, background.Thread.UserCallback, background.Mode.Once, 0);
                    }
                }

                const pressedHandler = irState.onIrButtonPressed.find(h => h.irButton === newCommand || IrButton.Any === h.irButton);
                if (pressedHandler) {
                    background.schedule(pressedHandler.onEvent, background.Thread.UserCallback, background.Mode.Once, 0);
                }

                irState.activeCommand = newCommand;
            }
        }
    }

    function initIrState() {
        if (irState) {
            return;
        }

        irState = {
            protocol: IrProtocol.Keyestudio, // Updated default to Keyestudio for robust compatibility
            bitsReceived: 0,
            hasNewDatagram: false,
            addressSectionBits: 0,
            commandSectionBits: 0,
            hiword: 0,
            loword: 0,
            activeCommand: -1,
            repeatTimeout: 0,
            onIrButtonPressed: [],
            onIrButtonReleased: [],
            onIrDatagram: undefined,
        };
    }

    //% blockId="makerbit_infrared_connect_receiver"
    //% block="connect IR receiver at pin %pin"
    //% pin.fieldEditor="gridpicker"
    //% pin.fieldOptions.tooltips="false"
    //% weight=90
    export function connectIrReceiver(pin: DigitalPin): void {
        initIrState();
        irState.protocol = IrProtocol.Keyestudio;
        enableIrMarkSpaceDetection(pin);
        background.schedule(notifyIrEvents, background.Thread.Priority, background.Mode.Repeat, REPEAT_TIMEOUT_MS);
    }

    function notifyIrEvents() {
        if (irState.activeCommand === -1) {
            // skip
        } else {
            const now = input.runningTime();
            if (now > irState.repeatTimeout) {
                const handler = irState.onIrButtonReleased.find(h => h.irButton === irState.activeCommand || IrButton.Any === h.irButton);
                if (handler) {
                    background.schedule(handler.onEvent, background.Thread.UserCallback, background.Mode.Once, 0);
                }

                irState.bitsReceived = 0;
                irState.activeCommand = -1;
            }
        }
    }

    //% blockId=makerbit_infrared_on_ir_button
    //% block="on IR button | %button | %action"
    //% button.fieldEditor="gridpicker"
    //% button.fieldOptions.tooltips="false"
    //% weight=50
    export function onIrButton(button: IrButton, action: IrButtonAction, handler: () => void) {
        initIrState();
        if (action === IrButtonAction.Pressed) {
            irState.onIrButtonPressed.push(new IrButtonHandler(button, handler));
        } else {
            irState.onIrButtonReleased.push(new IrButtonHandler(button, handler));
        }
    }

    //% blockId=makerbit_infrared_ir_button_pressed
    //% block="IR button"
    //% weight=70
    export function irButton(): number {
        basic.pause(0);
        if (!irState) {
            return IrButton.Any;
        }
        return irState.commandSectionBits >> 8;
    }

    //% blockId=makerbit_infrared_on_ir_datagram
    //% block="on IR datagram received"
    //% weight=40
    export function onIrDatagram(handler: () => void) {
        initIrState();
        irState.onIrDatagram = handler;
    }

    //% blockId=makerbit_infrared_ir_datagram
    //% block="IR datagram"
    //% weight=30
    export function irDatagram(): string {
        basic.pause(0);
        initIrState();
        return (
            "0x" +
            ir_rec_to16BitHex(irState.addressSectionBits) +
            ir_rec_to16BitHex(irState.commandSectionBits)
        );
    }

    //% blockId=makerbit_infrared_was_any_ir_datagram_received
    //% block="IR data was received"
    //% weight=80
    export function wasIrDataReceived(): boolean {
        basic.pause(0);
        initIrState();
        if (irState.hasNewDatagram) {
            irState.hasNewDatagram = false;
            return true;
        } else {
            return false;
        }
    }

    //% blockId=makerbit_infrared_button_code
    //% button.fieldEditor="gridpicker"
    //% button.fieldOptions.columns=3
    //% button.fieldOptions.tooltips="false"
    //% block="IR button code %button"
    //% weight=60
    export function irButtonCode(button: IrButton): number {
        basic.pause(0);
        return button as number;
    }

    function ir_rec_to16BitHex(value: number): string {
        let hex = "";
        for (let pos = 0; pos < 4; pos++) {
            let remainder = value % 16;
            if (remainder < 10) {
                hex = remainder.toString() + hex;
            } else {
                hex = String.fromCharCode(55 + remainder) + hex;
            }
            value = Math.idiv(value, 16);
        }
        return hex;
    }
}

namespace makerbit {
    export namespace background {

        export enum Thread {
            Priority = 0,
            UserCallback = 1,
        }

        export enum Mode {
            Repeat,
            Once,
        }

        class Executor {
            _newJobs: Job[] = [];
            _jobsToRemove: number[] = [];
            _pause: number = 100;
            _type: Thread;

            constructor(type: Thread) {
                this._type = type;
                control.runInParallel(() => this.loop());
            }

            push(task: () => void, delay: number, mode: Mode): number {
                if (delay > 0 && delay < this._pause && mode === Mode.Repeat) {
                    this._pause = Math.floor(delay);
                }
                const job = new Job(task, delay, mode);
                this._newJobs.push(job);
                return job.id;
            }

            cancel(jobId: number) {
                this._jobsToRemove.push(jobId);
            }

            loop(): void {
                const _jobs: Job[] = [];
                let previous = control.millis();

                while (true) {
                    const now = control.millis();
                    const delta = now - previous;
                    previous = now;

                    this._newJobs.forEach((job: Job) => {
                        _jobs.push(job);
                    });
                    this._newJobs = [];

                    this._jobsToRemove.forEach((jobId: number) => {
                        for (let i = _jobs.length - 1; i >= 0; i--) {
                            if (_jobs[i].id == jobId) {
                                _jobs.removeAt(i);
                                break;
                            }
                        }
                    });
                    this._jobsToRemove = [];

                    if (this._type === Thread.Priority) {
                        for (let i = _jobs.length - 1; i >= 0; i--) {
                            if (_jobs[i].run(delta)) {
                                this._jobsToRemove.push(_jobs[i].id);
                            }
                        }
                    } else {
                        for (let i = 0; i < _jobs.length; i++) {
                            if (_jobs[i].run(delta)) {
                                this._jobsToRemove.push(_jobs[i].id);
                            }
                        }
                    }

                    basic.pause(this._pause);
                }
            }
        }

        class Job {
            id: number;
            func: () => void;
            delay: number;
            remaining: number;
            mode: Mode;

            constructor(func: () => void, delay: number, mode: Mode) {
                this.id = randint(0, 2147483647);
                this.func = func;
                this.delay = delay;
                this.remaining = delay;
                this.mode = mode;
            }

            run(delta: number): boolean {
                if (delta <= 0) {
                    return false;
                }

                this.remaining -= delta;
                if (this.remaining > 0) {
                    return false;
                }

                switch (this.mode) {
                    case Mode.Once:
                        this.func();
                        basic.pause(0);
                        return true;
                    case Mode.Repeat:
                        this.func();
                        // Fix timer drift by carrying over the overshoot time
                        this.remaining = this.delay + this.remaining;
                        basic.pause(0);
                        return false;
                }
            }
        }

        const queues: Executor[] = [];

        export function schedule(
            func: () => void,
            type: Thread,
            mode: Mode,
            delay: number
        ): number {
            if (!func || delay < 0) return 0;

            if (!queues[type]) {
                queues[type] = new Executor(type);
            }

            return queues[type].push(func, delay, mode);
        }

        export function remove(type: Thread, jobId: number): void {
            if (queues[type]) {
                queues[type].cancel(jobId);
            }
        }
    }
}
