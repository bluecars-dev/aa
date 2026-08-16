/*
 * Tinybit Extension for micro:bit (Cleaned UI, Accurate Sensors)
 * Copyright (C): 2010-2019, Shenzhen Yahboom Tech
 */

//% color="#006400" weight=20 icon="\uf1b9" block="Tinybit"
namespace Tinybit {

    const PWM_ADD = 0x01;
    const MOTOR_REG = 0x02;
    const RGB_REG = 0x01;

    const bufMotor = pins.createBuffer(5);
    const bufRGB = pins.createBuffer(4);

    let yahStrip: neopixel.Strip = null;
    let linePinsInitialized = false;

    export enum enColor {
        //% blockId="OFF" block="OFF"
        OFF = 0,
        //% blockId="Red" block="Red"
        Red,
        //% blockId="Green" block="Green"
        Green,
        //% blockId="Blue" block="Blue"
        Blue,
        //% blockId="White" block="White"
        White,
        //% blockId="Cyan" block="Cyan"
        Cyan,
        //% blockId="Pinkish" block="Pinkish"
        Pinkish,
        //% blockId="Yellow" block="Yellow"
        Yellow
    }

    export enum enMusic {
        //% block="dadadum"
        dadadum = 0,
        //% block="entertainer"
        entertainer,
        //% block="prelude"
        prelude,
        //% block="ode"
        ode,
        //% block="nyan"
        nyan,
        //% block="ringtone"
        ringtone,
        //% block="funk"
        funk,
        //% block="blues"
        blues,
        //% block="birthday"
        birthday,
        //% block="wedding"
        wedding,
        //% block="funereal"
        funereal,
        //% block="punchline"
        punchline,
        //% block="baddy"
        baddy,
        //% block="chase"
        chase,
        //% block="ba_ding"
        ba_ding,
        //% block="wawawawaa"
        wawawawaa,
        //% block="jump up"
        jump_up,
        //% block="jump down"
        jump_down,
        //% block="power up"
        power_up,
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
        //% block="Stop"
        Car_Stop = 5,
        //% block="Spin left"
        Car_SpinLeft = 6,
        //% block="Spin right"
        Car_SpinRight = 7
    }

    function setPwmRGB(red: number, green: number, blue: number): void {
        bufRGB[0] = RGB_REG;
        bufRGB[1] = Math.clamp(0, 255, red);
        bufRGB[2] = Math.clamp(0, 255, green);
        bufRGB[3] = Math.clamp(0, 255, blue);
        pins.i2cWriteBuffer(PWM_ADD, bufRGB);
    }

    //% block="set left motor %sp_L right motor %sp_R"
    //% tooltip="Directly control the speed of the left and right motors (-255 to 255)."
    //% color="#006400" weight=87 blockGap=10
    //% sp_L.min=-255 sp_L.max=255 sp_R.min=-255 sp_R.max=255
    export function car_sport(sp_L: number, sp_R: number): void {
        sp_L = Math.clamp(-255, 255, sp_L);
        sp_R = Math.clamp(-255, 255, sp_R);

        bufMotor[0] = MOTOR_REG;

        if (sp_L < 0) { bufMotor[1] = 0; bufMotor[2] = -sp_L; } 
        else { bufMotor[1] = sp_L; bufMotor[2] = 0; }

        if (sp_R < 0) { bufMotor[3] = 0; bufMotor[4] = -sp_R; } 
        else { bufMotor[3] = sp_R; bufMotor[4] = 0; }

        pins.i2cWriteBuffer(PWM_ADD, bufMotor);
    }

    function Car_run(speed1: number, speed2: number): void { car_sport(speed1, speed2); }
    function Car_back(speed1: number, speed2: number): void { car_sport(-speed1, -speed2); }
    function Car_left(speed1: number, speed2: number): void { car_sport(0, speed2); }
    function Car_right(speed1: number, speed2: number): void { car_sport(speed1, 0); }
    function Car_spinleft(speed1: number, speed2: number): void { car_sport(-speed1, speed2); }
    function Car_spinright(speed1: number, speed2: number): void { car_sport(speed1, -speed2); }
    function Car_stop(): void { car_sport(0, 0); }

    //% block="Tinybit NeoPixel LEDs"
    //% tooltip="Access the programmable RGB LEDs on the car."
    //% weight=99 blockGap=10 color="#006400"
    export function RGB_Car_Program(): neopixel.Strip {
        if (!yahStrip) {
            yahStrip = neopixel.create(DigitalPin.P12, 2, NeoPixelMode.RGB);
        }
        return yahStrip;
    }

    //% block="set car LEDs to color %value"
    //% tooltip="Set the car's headlights to a preset color."
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
    //% tooltip="Mix your own color for the headlights using Red, Green, and Blue values (0-255)."
    //% weight=97 blockGap=10 color="#006400"
    //% r.min=0 r.max=255 g.min=0 g.max=255 b.min=0 b.max=255
    export function RGB_Car_Big2(r: number, g: number, b: number): void {
        setPwmRGB(r, g, b);
    }

    //% block="play car melody %index"
    //% tooltip="Play a built-in melody through the car's buzzer."
    //% weight=95 blockGap=10 color="#006400"
    export function Music_Car(index: enMusic): void {
        switch (index) {
            case enMusic.dadadum: music.beginMelody(music.builtInMelody(Melodies.Dadadadum), MelodyOptions.Once); break;
            case enMusic.birthday: music.beginMelody(music.builtInMelody(Melodies.Birthday), MelodyOptions.Once); break;
            case enMusic.entertainer: music.beginMelody(music.builtInMelody(Melodies.Entertainer), MelodyOptions.Once); break;
            case enMusic.prelude: music.beginMelody(music.builtInMelody(Melodies.Prelude), MelodyOptions.Once); break;
            case enMusic.ode: music.beginMelody(music.builtInMelody(Melodies.Ode), MelodyOptions.Once); break;
            case enMusic.nyan: music.beginMelody(music.builtInMelody(Melodies.Nyan), MelodyOptions.Once); break;
            case enMusic.ringtone: music.beginMelody(music.builtInMelody(Melodies.Ringtone), MelodyOptions.Once); break;
            case enMusic.funk: music.beginMelody(music.builtInMelody(Melodies.Funk), MelodyOptions.Once); break;
            case enMusic.blues: music.beginMelody(music.builtInMelody(Melodies.Blues), MelodyOptions.Once); break;
            case enMusic.wedding: music.beginMelody(music.builtInMelody(Melodies.Wedding), MelodyOptions.Once); break;
            case enMusic.funereal: music.beginMelody(music.builtInMelody(Melodies.Funeral), MelodyOptions.Once); break;
            case enMusic.punchline: music.beginMelody(music.builtInMelody(Melodies.Punchline), MelodyOptions.Once); break;
            case enMusic.baddy: music.beginMelody(music.builtInMelody(Melodies.Baddy), MelodyOptions.Once); break;
            case enMusic.chase: music.beginMelody(music.builtInMelody(Melodies.Chase), MelodyOptions.Once); break;
            case enMusic.ba_ding: music.beginMelody(music.builtInMelody(Melodies.BaDing), MelodyOptions.Once); break;
            case enMusic.wawawawaa: music.beginMelody(music.builtInMelody(Melodies.Wawawawaa), MelodyOptions.Once); break;
            case enMusic.jump_up: music.beginMelody(music.builtInMelody(Melodies.JumpUp), MelodyOptions.Once); break;
            case enMusic.jump_down: music.beginMelody(music.builtInMelody(Melodies.JumpDown), MelodyOptions.Once); break;
            case enMusic.power_up: music.beginMelody(music.builtInMelody(Melodies.PowerUp), MelodyOptions.Once); break;
            case enMusic.power_down: music.beginMelody(music.builtInMelody(Melodies.PowerDown), MelodyOptions.Once); break;
        }
    }

    //% block="car move %index"
    //% tooltip="Make the car move in a specific direction at maximum speed."
    //% weight=93 blockGap=10 color="#006400"
    export function CarCtrl(index: CarState): void {
        CarCtrlSpeed(index, 255);
    }

    //% block="car move %index at speed %speed"
    //% tooltip="Make the car move in a specific direction at a set speed."
    //% weight=92 blockGap=10 speed.min=0 speed.max=255 color="#006400"
    export function CarCtrlSpeed(index: CarState, speed: number): void {
        CarCtrlSpeed2(index, speed, speed);
    }

    //% block="car move %index with Left speed %speed1 Right speed %speed2"
    //% tooltip="Advanced car movement with individual speed controls for turning."
    //% weight=91 blockGap=10 speed1.min=0 speed1.max=255 speed2.min=0 speed2.max=255 color="#006400"
    export function CarCtrlSpeed2(index: CarState, speed1: number, speed2: number): void {
        switch (index) {
            case CarState.Car_Run: Car_run(speed1, speed2); break;
            case CarState.Car_Back: Car_back(speed1, speed2); break;
            case CarState.Car_Left: Car_left(speed1, speed2); break;
            case CarState.Car_Right: Car_right(speed1, speed2); break;
            case CarState.Car_Stop: Car_stop(); break;
            case CarState.Car_SpinLeft: Car_spinleft(speed1, speed2); break;
            case CarState.Car_SpinRight: Car_spinright(speed1, speed2); break;
        }
    }

    //% block="%direct line sensor detects %value line"
    //% tooltip="Returns true if the selected line sensor detects the chosen line color."
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
    //% tooltip="Returns the current volume level picked up by the microphone (0-1023)."
    //% weight=88 blockGap=10 color="#006400"
    export function Voice_Sensor(): number {
        return pins.analogReadPin(AnalogPin.P1);
    }

    //% block="ultrasonic distance (cm)"
    //% tooltip="Reads the distance to an obstacle in centimeters using the ultrasonic sensor."
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

    //% block="ultrasonic distance for V2 (cm)"
    //% tooltip="Reads the distance to an obstacle for V2 boards."
    //% color="#006400" weight=86 blockGap=10
    export function Ultrasonic_CarV2(): number {
        return Ultrasonic_Car();
    }
}
