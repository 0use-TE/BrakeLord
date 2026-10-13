// 浏览器端固定步长模拟。速度单位 m/s，距离 m，踏板力度 N。
export const STEP = 1 / 120;
export const TRACK = Object.freeze({barrierDistance:2000,carFront:2.7});
const originalBrake = { minSpeedKmh: 100, breakForceN: 1612, rampBase: 200,
  rampGrowth: 400, releaseRate: 900, decelPerNewton: 10.8 / 1612,
  rollingDecel: .15, dragCoeff: .00022, stopSpeed: .08 };
export const VEHICLES = [
  { id: 'v800', name: '尊界 V800', badge: '均衡', color: '#b99562', shape: [1,1,1],
    description: '原版制动参数。越接近极限，越考验松脚时机。',
    quip: '踏板减重方案已提前交付。',
    car: { massKg: 2800, maxSpeedKmh: 260, launchAccel: 7.4, accelFalloffExp: 1.55 },
    brake: { ...originalBrake } },
  { id: 's800', name: '尊界 S800', badge: '性能', color: '#80569b', shape: [1,.87,1.06], scoreScale:1.106,
    reference:{variant:'纯电星辉尊享版',url:'https://hima.auto/zunjie/s800/configuration/',zeroTo100:4.3},
    description: '参考纯电版 210 km/h、零百 4.3 秒。游戏中制动强，踏板容错较小。',
    quip: '从容，是给路障充分的准备时间。',
    car: { massKg: 2700, maxSpeedKmh: 210, launchAccel: 7.543, accelFalloffExp: 1.5 },
    brake: { ...originalBrake, breakForceN: 1450, decelPerNewton: 13 / 1450 } },
  { id: 'm9', name: '问界 M9', badge: '稳健', color: '#557e86', shape: [1,.95,.95], scoreScale:1.432,
    reference:{variant:'2025 款享六座增程 Ultra',url:'https://hima.auto/wenjie/m9/configuration/',zeroTo100:5.1},
    description: '参考普通增程版 200 km/h、零百 5.1 秒。游戏中踏板耐受高，制动较缓。',
    quip: '车辆已领先，踏板正在独立探索。',
    car: { massKg: 2600, maxSpeedKmh: 200, launchAccel: 6.324, accelFalloffExp: 1.6 },
    brake: { ...originalBrake, breakForceN: 2100, decelPerNewton: 10.6 / 2100 } },
  { id:'l9',name:'理想 L9',badge:'巡航',color:'#809583',shape:[1.015,1,1],scoreScale:1.305,
    description:'大型家庭 SUV。游戏中踏板容错较大，制动表现居中。',
    quip:'全家人的从容，暂时交给了路障。',
    car:{massKg:2520,maxSpeedKmh:200,launchAccel:7.1,accelFalloffExp:1.5},
    brake:{...originalBrake,breakForceN:1900,decelPerNewton:11.8/1900} }
];
export function vehicleById(id) { return VEHICLES.find(v => v.id === id); }
export function score(v, time) { return time <= 0 ? 0 : Math.round(v * v / time); }
export function vehicleScore(vehicle,v,time){return time<=0?0:Math.round(v*v/time*(vehicle.scoreScale||1));}
export class Dynamics {
  constructor(vehicle) { this.vehicle = vehicle; this.reset(); }
  reset() { this.speed = 0; this.distance = 0; this.pedalForce = 0; this.accel = 0; this.powerCut = false; this.holdTime = 0; }
  get speedKmh() { return this.speed * 3.6; }
  step(dt, pressed) {
    const { car, brake } = this.vehicle;
    let accel;
    if (this.powerCut) {
      if (pressed) {
        this.holdTime += dt;
        this.pedalForce += (brake.rampBase + 2 * brake.rampGrowth * this.holdTime) * dt;
      } else {
        this.holdTime = 0;
        this.pedalForce = Math.max(0, this.pedalForce - brake.releaseRate * dt);
      }
      accel = -(brake.rollingDecel + brake.dragCoeff * this.speed ** 2 + brake.decelPerNewton * this.pedalForce);
    } else {
      const fraction = Math.min(this.speed / (car.maxSpeedKmh / 3.6), 1);
      accel = car.launchAccel * (1 - fraction ** car.accelFalloffExp);
    }
    this.accel = accel;
    this.speed = Math.max(0, this.speed + accel * dt);
    this.distance += this.speed * dt;
    return this.powerCut && this.pedalForce >= brake.breakForceN;
  }
}
export class Game {
  constructor(vehicle = VEHICLES[0]) { this.setVehicle(vehicle); this.phase = 'menu'; }
  setVehicle(vehicle) { this.vehicle = vehicle; this.dynamics = new Dynamics(vehicle); this.toMenu(); }
  toMenu() { this.dynamics.reset(); this.phase = 'menu'; this.brakeElapsed = 0; this.samples = []; this.peakForce = 0; this.v0Kmh = 0; this.finalResult = null; }
  start() {
    this.toMenu(); this.countdown = 3; this.lastCountdownTick = 4;
    this.brakeStartDistance = 0; this.earlyHintCooldown = 0; this.sampleTimer = 0;
    this.phase = 'countdown'; return [];
  }
  get canBrake() { return this.phase === 'accelerating' && this.dynamics.speedKmh >= this.vehicle.brake.minSpeedKmh; }
  get distanceToBarrier() { return TRACK.barrierDistance - TRACK.carFront - this.dynamics.distance; }
  step(dt, pressed) {
    const events = [];
    this.earlyHintCooldown = Math.max(0, this.earlyHintCooldown - dt);
    if (this.phase === 'countdown') {
      this.countdown -= dt; const tick = Math.ceil(this.countdown);
      if (tick < this.lastCountdownTick && tick > 0) { this.lastCountdownTick = tick; events.push({ type:'countdown', value:tick }); }
      if (this.countdown <= 0) { this.phase = 'accelerating'; events.push({ type:'start' }); }
    } else if (this.phase === 'accelerating') {
      if (pressed) {
        if (this.canBrake) {
          this.phase = 'braking'; this.dynamics.powerCut = true;
          this.v0Kmh = this.dynamics.speedKmh; this.brakeStartDistance = this.dynamics.distance;
          this.recordSample(); events.push({ type:'brake_start', v0Kmh:this.v0Kmh });
        } else if (this.earlyHintCooldown === 0) {
          this.earlyHintCooldown = 1.2; events.push({ type:'brake_too_early' });
        }
      }
      if (this.phase === 'accelerating') { this.dynamics.step(dt, false); this.checkBarrier(events); }
      else this.stepBraking(dt, pressed, events);
    } else if (this.phase === 'braking') this.stepBraking(dt, pressed, events);
    return events;
  }
  stepBraking(dt, pressed, events) {
    const snapped = this.dynamics.step(dt, pressed);
    this.brakeElapsed += dt; this.peakForce = Math.max(this.peakForce, this.dynamics.pedalForce);
    this.sampleTimer += dt;
    if (this.sampleTimer >= .04) { this.sampleTimer -= .04; this.recordSample(); }
    if (snapped) {
      this.dynamics.pedalForce = this.vehicle.brake.breakForceN;
      this.peakForce = this.vehicle.brake.breakForceN; this.crash('brake_snap', events);
    } else if (!this.checkBarrier(events) && this.dynamics.speed <= this.vehicle.brake.stopSpeed) {
      this.dynamics.speed = 0; this.phase = 'stopped'; this.finalResult = this.result(true);
      events.push({ type:'stopped', result:this.finalResult });
    }
  }
  recordSample() { this.samples.push({ t:this.brakeElapsed, speedKmh:this.dynamics.speedKmh, force:Math.min(this.dynamics.pedalForce,this.vehicle.brake.breakForceN) }); }
  checkBarrier(events) { if (this.distanceToBarrier > 0) return false; this.crash('barrier',events); return true; }
  crash(reason, events) { this.phase = 'crashed'; this.finalResult = this.result(false,reason); events.push({ type:'crash', reason, result:this.finalResult }); }
  result(success, reason) {
    if (this.v0Kmh > 0) this.recordSample();
    const stopSeconds = Math.round(this.brakeElapsed * 1000) / 1000;
    const v0Kmh = Math.round(this.v0Kmh * 10) / 10;
    return { success, reason, v0Kmh, stopSeconds, stopDistance:this.dynamics.distance-this.brakeStartDistance,
      peakForce:this.peakForce, baseScore:success?score(v0Kmh,stopSeconds):0, scoreScale:this.vehicle.scoreScale||1,
      score:success?vehicleScore(this.vehicle,v0Kmh,stopSeconds):0, samples:this.samples.slice() };
  }
  snapshot() {
    const d = this.dynamics;
    return { phase:this.phase, vehicleId:this.vehicle.id, speed:d.speed, distance:d.distance,
      pedalForce:d.pedalForce, accel:d.accel, powerCut:d.powerCut, holdTime:d.holdTime,
      countdown:this.countdown, brakeElapsed:this.brakeElapsed, v0Kmh:this.v0Kmh, peakForce:this.peakForce };
  }
}
