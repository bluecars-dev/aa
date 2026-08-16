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
