/**
 * Curling Physics & Rules Engine
 */
(function(window) {
  'use strict';

  var RINK = {
    width: 400,
    height: 900,
    teeX: 200,
    teeY: 180,
    hackY: 760,
    hogLineY: 420,
    backLineY: 55,
    minX: 25,
    maxX: 375,
    houseRadius12: 120, // 12-foot
    houseRadius8: 80,   // 8-foot
    houseRadius4: 40,   // 4-foot
    buttonRadius: 14,   // Button
    stoneRadius: 16,
    defaultFriction: 0.987,
    sweepFriction: 0.996
  };

  function CurlingStone(id, team, x, y) {
    this.id = id;
    this.team = team; // 'red' (or 'black') / 'yellow' (or 'white')
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.rotation = 0;
    this.vRot = 0;
    this.isMoving = false;
    this.inPlay = true;
    this.radius = RINK.stoneRadius;
    this.mass = 20.0;
    this.wasDelivered = false;
  }

  function CurlingEngine() {
    this.rink = RINK;
    this.stones = [];
    this.currentEnd = 1;
    this.totalEnds = 3;
    this.stonesPerTeam = 4;
    this.redRemaining = 4;
    this.yellowRemaining = 4;
    this.currentTurn = 'red'; // 'red' starts first end
    this.scores = {
      red: [0, 0, 0],
      yellow: [0, 0, 0]
    };
    this.isSweeping = false;
    this.sweepTimer = 0;
    this.activeStone = null;
    this.nextStoneId = 1;
    this.endOver = false;
    this.gameOver = false;
    this.collisionCallbacks = [];
  }

  CurlingEngine.prototype.initGame = function(totalEnds, stonesPerTeam) {
    this.totalEnds = totalEnds || 3;
    this.stonesPerTeam = stonesPerTeam || 4;
    this.currentEnd = 1;
    this.scores = {
      red: new Array(this.totalEnds).fill(0),
      yellow: new Array(this.totalEnds).fill(0)
    };
    this.currentTurn = 'red';
    this.gameOver = false;
    this.startNewEnd();
  };

  CurlingEngine.prototype.startNewEnd = function() {
    this.stones = [];
    this.redRemaining = this.stonesPerTeam;
    this.yellowRemaining = this.stonesPerTeam;
    this.activeStone = null;
    this.endOver = false;
    this.isSweeping = false;
  };

  CurlingEngine.prototype.prepareNextThrow = function() {
    if (this.redRemaining === 0 && this.yellowRemaining === 0) {
      return null;
    }
    var stone = new CurlingStone(
      this.nextStoneId++,
      this.currentTurn,
      RINK.teeX,
      RINK.hackY
    );
    this.activeStone = stone;
    return stone;
  };

  CurlingEngine.prototype.deliverStone = function(vx, vy) {
    if (!this.activeStone) return;
    this.activeStone.vx = vx;
    this.activeStone.vy = vy;
    this.activeStone.vRot = (vx > 0 ? 0.05 : -0.05) + (Math.random() - 0.5) * 0.02;
    this.activeStone.isMoving = true;
    this.activeStone.wasDelivered = true;
    this.stones.push(this.activeStone);
  };

  CurlingEngine.prototype.triggerSweep = function(durationFrames) {
    this.isSweeping = true;
    this.sweepTimer = Math.max(this.sweepTimer, durationFrames || 25);
  };

  CurlingEngine.prototype.update = function() {
    var anyMoving = false;
    var currentFriction = (this.isSweeping && this.sweepTimer > 0) ? RINK.sweepFriction : RINK.defaultFriction;

    if (this.sweepTimer > 0) {
      this.sweepTimer--;
      if (this.sweepTimer <= 0) {
        this.isSweeping = false;
      }
    }

    // 1. Move all stones & apply friction
    for (var i = 0; i < this.stones.length; i++) {
      var s = this.stones[i];
      if (!s.inPlay) continue;

      if (s.isMoving) {
        s.x += s.vx;
        s.y += s.vy;
        s.rotation += s.vRot;

        // Apply friction
        var friction = (s === this.activeStone) ? currentFriction : RINK.defaultFriction;
        s.vx *= friction;
        s.vy *= friction;
        s.vRot *= 0.99;

        // Slight natural curling curve towards rotation
        s.vx += s.vRot * 0.08;

        var speed = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
        if (speed < 0.05) {
          s.vx = 0;
          s.vy = 0;
          s.vRot = 0;
          s.isMoving = false;
        } else {
          anyMoving = true;
        }

        // Side cushions bounce
        if (s.x - s.radius < RINK.minX) {
          s.x = RINK.minX + s.radius;
          s.vx = -s.vx * 0.7;
        } else if (s.x + s.radius > RINK.maxX) {
          s.x = RINK.maxX - s.radius;
          s.vx = -s.vx * 0.7;
        }

        // Back line out-of-play check
        if (s.y - s.radius < RINK.backLineY) {
          s.inPlay = false;
          s.isMoving = false;
        }

        // Hack line rebound / back wall check
        if (s.y + s.radius > RINK.hackY + 40 && s !== this.activeStone) {
          s.inPlay = false;
          s.isMoving = false;
        }
      }
    }

    // 2. Elastic 2D Collisions between stones
    for (var a = 0; a < this.stones.length; a++) {
      var sA = this.stones[a];
      if (!sA.inPlay) continue;

      for (var b = a + 1; b < this.stones.length; b++) {
        var sB = this.stones[b];
        if (!sB.inPlay) continue;

        var dx = sB.x - sA.x;
        var dy = sB.y - sA.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var minDist = sA.radius + sB.radius;

        if (dist < minDist && dist > 0.001) {
          // Normal vector
          var nx = dx / dist;
          var ny = dy / dist;

          // Separate overlapping stones
          var overlap = minDist - dist;
          sA.x -= nx * overlap * 0.5;
          sA.y -= ny * overlap * 0.5;
          sB.x += nx * overlap * 0.5;
          sB.y += ny * overlap * 0.5;

          // Relative velocity
          var kx = sA.vx - sB.vx;
          var ky = sA.vy - sB.vy;
          var p = 2 * (nx * kx + ny * ky) / (sA.mass + sB.mass);

          var restitution = 0.93; // Granite elasticity
          sA.vx -= p * sB.mass * nx * restitution;
          sA.vy -= p * sB.mass * ny * restitution;
          sB.vx += p * sA.mass * nx * restitution;
          sB.vy += p * sA.mass * ny * restitution;

          sA.isMoving = true;
          sB.isMoving = true;
          anyMoving = true;

          // Sound callback
          var impactSpeed = Math.sqrt(kx * kx + ky * ky);
          this.notifyCollision(impactSpeed);
        }
      }
    }

    // Check if throw just finished
    if (!anyMoving && this.activeStone && this.activeStone.wasDelivered && !this.activeStone.isMoving) {
      this.finishThrow();
    }

    return anyMoving;
  };

  CurlingEngine.prototype.notifyCollision = function(speed) {
    for (var i = 0; i < this.collisionCallbacks.length; i++) {
      this.collisionCallbacks[i](speed);
    }
  };

  CurlingEngine.prototype.onCollision = function(cb) {
    this.collisionCallbacks.push(cb);
  };

  CurlingEngine.prototype.finishThrow = function() {
    var thrown = this.activeStone;
    this.activeStone = null;

    // Check Hog Line rule: stone must pass hogLineY to stay in play
    if (thrown && thrown.inPlay) {
      if (thrown.y > RINK.hogLineY) {
        // Did not cross hog line -> removed!
        thrown.inPlay = false;
      }
    }

    // Deduct thrown stone
    if (this.currentTurn === 'red') {
      this.redRemaining--;
      this.currentTurn = 'yellow';
    } else {
      this.yellowRemaining--;
      this.currentTurn = 'red';
    }

    // Check if end is complete
    if (this.redRemaining === 0 && this.yellowRemaining === 0) {
      this.calculateEndScore();
    }
  };

  CurlingEngine.prototype.calculateEndScore = function() {
    this.endOver = true;

    // Stones in house: dist <= houseRadius12 + stoneRadius
    var maxDist = RINK.houseRadius12 + RINK.stoneRadius;
    var candidates = [];

    for (var i = 0; i < this.stones.length; i++) {
      var s = this.stones[i];
      if (!s.inPlay) continue;

      var dx = s.x - RINK.teeX;
      var dy = s.y - RINK.teeY;
      var dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= maxDist) {
        candidates.push({ stone: s, dist: dist, team: s.team });
      }
    }

    // Sort by closest to button
    candidates.sort(function(a, b) {
      return a.dist - b.dist;
    });

    var endResult = {
      winner: null,
      points: 0,
      scoringStones: []
    };

    if (candidates.length === 0) {
      // Blank end (무득점 0-0)
      this.scores.red[this.currentEnd - 1] = 0;
      this.scores.yellow[this.currentEnd - 1] = 0;
    } else {
      var winnerTeam = candidates[0].team;
      endResult.winner = winnerTeam;

      // Find closest stone of opponent
      var oppClosestDist = Infinity;
      for (var j = 0; j < candidates.length; j++) {
        if (candidates[j].team !== winnerTeam) {
          oppClosestDist = candidates[j].dist;
          break;
        }
      }

      // Count winner stones closer than opponent's closest
      for (var k = 0; k < candidates.length; k++) {
        if (candidates[k].team === winnerTeam && candidates[k].dist < oppClosestDist) {
          endResult.points++;
          endResult.scoringStones.push(candidates[k].stone);
        } else {
          break;
        }
      }

      if (winnerTeam === 'red') {
        this.scores.red[this.currentEnd - 1] = endResult.points;
        this.scores.yellow[this.currentEnd - 1] = 0;
        // Next end: winner throws first (or standard curling: winner gives hammer to loser)
        this.currentTurn = 'yellow';
      } else {
        this.scores.yellow[this.currentEnd - 1] = endResult.points;
        this.scores.red[this.currentEnd - 1] = 0;
        this.currentTurn = 'red';
      }
    }

    if (this.currentEnd >= this.totalEnds) {
      this.gameOver = true;
    }

    return endResult;
  };

  CurlingEngine.prototype.getTotalScore = function() {
    var redSum = 0;
    var yellowSum = 0;
    for (var i = 0; i < this.totalEnds; i++) {
      redSum += (this.scores.red[i] || 0);
      yellowSum += (this.scores.yellow[i] || 0);
    }
    return { red: redSum, yellow: yellowSum };
  };

  // -------------------------------------------------------------
  // AI Helper: Calculates shot velocity for AI turn
  // -------------------------------------------------------------
  CurlingEngine.prototype.computeAIShot = function(level) {
    // Level 1: Beginner, Level 2: Club, Level 3: Master
    var targetX = RINK.teeX;
    var targetY = RINK.teeY;

    // Look at house state
    var oppTeam = (this.currentTurn === 'red') ? 'yellow' : 'red';
    var oppStones = [];
    var ownStones = [];

    for (var i = 0; i < this.stones.length; i++) {
      var s = this.stones[i];
      if (!s.inPlay) continue;
      var d = Math.sqrt(Math.pow(s.x - RINK.teeX, 2) + Math.pow(s.y - RINK.teeY, 2));
      if (d <= RINK.houseRadius12 + RINK.stoneRadius) {
        if (s.team === oppTeam) oppStones.push({ stone: s, dist: d });
        else ownStones.push({ stone: s, dist: d });
      }
    }

    oppStones.sort(function(a, b) { return a.dist - b.dist; });
    ownStones.sort(function(a, b) { return a.dist - b.dist; });

    var shotType = 'draw'; // 'draw' or 'takeout' or 'guard'
    var targetStone = null;

    if (level >= 2 && oppStones.length > 0) {
      var bestOpp = oppStones[0];
      // If opponent is closer than own best stone, take it out!
      if (ownStones.length === 0 || bestOpp.dist < ownStones[0].dist) {
        shotType = 'takeout';
        targetStone = bestOpp.stone;
      }
    }

    if (shotType === 'takeout' && targetStone) {
      targetX = targetStone.x;
      targetY = targetStone.y;
    } else {
      // Draw to button with slight random spread
      targetX = RINK.teeX + (Math.random() - 0.5) * (level === 1 ? 40 : 15);
      targetY = RINK.teeY + (Math.random() - 0.5) * (level === 1 ? 40 : 15);
    }

    // Distance and required launch velocity
    var dx = targetX - RINK.teeX;
    var dy = targetY - RINK.hackY;
    var dist = Math.sqrt(dx * dx + dy * dy);

    // Approximate speed needed for distance on ice:
    // v^2 = 2 * a * d where friction deceleration approx 0.013 * 60
    var basePower = (shotType === 'takeout') ? 14.5 : 10.8;
    var speed = basePower * (dist / 640);

    // Accuracy noise by AI level
    var noiseAngle = 0;
    var noiseSpeed = 1;
    if (level === 1) {
      noiseAngle = (Math.random() - 0.5) * 0.08;
      noiseSpeed = 0.88 + Math.random() * 0.24;
    } else if (level === 2) {
      noiseAngle = (Math.random() - 0.5) * 0.035;
      noiseSpeed = 0.95 + Math.random() * 0.10;
    } else {
      noiseAngle = (Math.random() - 0.5) * 0.012;
      noiseSpeed = 0.98 + Math.random() * 0.04;
    }

    var angle = Math.atan2(dy, dx) + noiseAngle;
    var finalSpeed = speed * noiseSpeed;

    return {
      vx: Math.cos(angle) * finalSpeed,
      vy: Math.sin(angle) * finalSpeed,
      shotType: shotType
    };
  };

  window.CurlingEngine = CurlingEngine;
})(window);
