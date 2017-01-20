window.onload = function () {

    var Q = window.Q = new Quintus({development: true})
        .include([Quintus.Sprites, Quintus.Audio, Quintus.Scenes, Quintus.Anim, Quintus['2D'], Quintus.Input, Quintus.Touch, Quintus.UI])
        .setup('quintus', {maximize: true,})
        .touch()
        .enableSound()
        .controls();

    Q.scene('startGame', function (stage) {
        console.log('Écran de lancement affiché');

        Q.audio.play('menu.mp3', {loop: true});

        $score = $('.score');
        $life = $('.life');
        $scoreContain = $('.contain_score');
        $lifeContain = $('.contain_life');
        $sacha = $('.contain_sacha');
        $timer = $('.contain_timer');

        $sacha.show();
        $lifeContain.hide();
        $scoreContain.hide();
        $timer.hide();

        var sprite_bg = new Q.Sprite({x: 0, y: 0, w: Q.width, h: Q.height, type: Q.SPRITE_UI});

        sprite_bg.draw = function (ctx) {
            base_image = new Image();
            base_image.src = 'images/background-menu.png';
            ctx.drawImage(base_image, 0, 0, this.p.w, this.p.h);
        };

        stage.insert(sprite_bg);

        var title = stage.insert(new Q.UI.Text({
            x: Q.width / 2,
            y: 50,
            label: 'Splash Power Running Game',
            align: 'center',
            family: 'Comic Sans MS, Comis Sans, cursive',
            size: 48,
            color: 'white'
        }));

        var container = stage.insert(new Q.UI.Container({
            x: Q.width / 2,
            y: Q.height / 3,
            fill: 'rgba(0, 0, 0, 0.5)',
            radius: 10
        }));

        var buttonPlayGame = container.insert(new Q.UI.Button({
            label: "Lancer le jeu",
            y: 0,
            x: 0,
            fill: "white",
            border: 5
        }, function () {
            Q.clearStages();
            console.log('lancement partie');

            Q.load("player.json, player.png, background-wall.png, background-floor.png, ball.png, ball.json, heart.json, heart.png,fantominus.png, fantominus.json, ball.mp3, game.mp3, pikachu.mp3, beginPika.mp3, endPika.mp3, coins.json, coins.png, coins.mp3", function () {
                Q.compileSheets("player.png", "player.json");
                Q.compileSheets("fantominus.png", "fantominus.json");
                Q.compileSheets("ball.png", "ball.json");
                Q.compileSheets("heart.png", "heart.json");
                Q.compileSheets("coins.png", "coins.json");
                Q.animations("player", {
                    walk_right: {frames: [0, 1, 2], rate: 3 / 15, flip: false, loop: true},
                    jump_right: {frames: [2], rate: 1 / 10, flip: false},
                    duck_right: {frames: [9, 10], rate: 1 / 10, flip: false},
                });

                Q.stageScene("level");
            });
        }));

        var buttonInstruction = container.insert(new Q.UI.Button({
            label: "Régle du jeu",
            y: 100,
            x: 0,
            fill: "white",
            border: 5
        }, function () {
            console.log('Instruction');
        }));

        container.fit(80);
    });


    Q.scene("level", function (stage) {

        var life = ['100'];
        var score = [0];
        var spoil = true;
        var ghost = false;
        var countGhost = 0;
        var timer = 5;

        Q.audio.play('game.mp3', {loop: true});
        Q.audio.play('beginPika.mp3');
        Q.audio.stop('endPika.mp3');
        Q.audio.stop('menu.mp3');

        $sacha.hide();
        $life.css("width", life[0] + '%');
        $life.css('background-color', '#EE68EA');
        $score.html(score[0]);

        $scoreContain.show();
        $lifeContain.show();

        var SPRITE_BALL = 1;

        Q.gravityY = 2000;

        Q.Sprite.extend("Player", {
            init: function (p) {
                this._super(p, {
                    sheet: "player",
                    sprite: "player",
                    collisionMask: SPRITE_BALL,
                    x: 40,
                    y: 660,
                    standingPoints: [[-16, 44], [-23, 35], [-23, -48], [23, -48], [23, 35], [16, 44]],
                    duckingPoints: [[-16, 44], [-23, 35], [-23, -10], [23, -10], [23, 35], [16, 44]],
                    speed: 500,
                    jump: -700
                });

                this.p.points = this.p.standingPoints;
                this.add("2d, animation");
            },

            step: function (dt) {
                this.p.vx += (this.p.speed - this.p.vx) / 4;

                if (this.p.y > 660) {
                    this.p.y = 660;
                    this.p.landed = 1;
                    this.p.vy = 0;
                } else {
                    this.p.landed = 0;
                }

                if (Q.inputs['up'] && this.p.landed > 0) {
                    this.p.vy = this.p.jump;
                }

                this.p.points = this.p.standingPoints;
                if (this.p.landed) {
                    if (Q.inputs['down']) {
                        this.play("duck_right");
                        this.p.points = this.p.duckingPoints;
                    } else {
                        this.play("walk_right");
                    }
                } else {
                    this.play("jump_right");
                }
                this.stage.viewport.centerOn(this.p.x + 300, 400);
            }
        });

        Q.Sprite.extend("Ball", {
            init: function () {
                var levels = [660, 635, 605, 540];
                var player = Q("Player").first();

                this._super({
                    x: player.p.x + Q.width + 50,
                    y: levels[Math.floor(Math.random() * 3)],
                    frame: Math.floor(Math.random() * 3),
                    scale: 2,
                    type: SPRITE_BALL,
                    sheet: "ball",
                    vx: -600 + 200 * Math.random(),
                    vy: 0,
                    ay: 0,
                    theta: (300 * Math.random() + 200) * (Math.random() < 0.5 ? 1 : -1)
                });

                this.on("hit");
            },

            step: function (dt) {
                this.p.x += this.p.vx * dt;
                this.p.vy += this.p.ay * dt;
                this.p.y += this.p.vy * dt;

                this.p.angle += this.p.theta * dt;

                if (ghost == true) {
                    this.p.type = 0;
                    this.p.collisionMask = Q.SPRITE_NONE;
                    this.p.opacity = 0.5;
                }
            },

            hit: function () {

                if (this.p.type != 0) {
                    life[0] = life[0] - 25;
                    $life.css('width', life[0] + '%');
                    Q.audio.play('ball.mp3');
                    spoil = false;

                    if (life[0] == 0) {
                        Q.audio.play('endPika.mp3');
                        $life.css('background-color', 'red');
                        $life.css('width', '100%');
                        Q.audio.stop('game.mp3');
                        Q("BallThrower").destroy();
                        Q("Player").destroy();
                        Q("Ball").destroy();
                        Q("Ghosts").destroy();
                        Q("Coins").destroy();
                        Q.stageScene('endGame', 1);
                    }
                }

                this.p.type = 0;
                this.p.collisionMask = Q.SPRITE_NONE;
                this.p.vx = 200;
                this.p.ay = 400;
                this.p.vy = -300;
                this.p.opacity = 0.5;
            }
        });

        Q.GameObject.extend("BallThrower", {
            init: function () {
                this.p = {
                    launchDelay: 0.75,
                    launchRandom: 1,
                    launch: 2
                }
            },

            update: function (dt) {
                this.p.launch -= dt;

                if (this.p.launch < 0 && spoil == true) {
                    this.stage.insert(new Q.Ball());
                    this.p.launch = this.p.launchDelay + this.p.launchRandom * Math.random();
                    score[0] = score[0] + 1;
                    $score.html(score[0]);

                    if (score[0] % 5 == 0) {
                        this.p.launchRandom = this.p.launchRandom - 0.05;
                    }

                    if (ghost == true) {
                        countGhost++;

                        $timer.show();
                        $('.timerCount').html(timer);
                        timer--;

                        if (countGhost == 6) {
                            ghost = false;
                            $timer.hide();
                            timer = 5;
                            countGhost = 0;
                        }
                    }
                }

                spoil = true;
            }
        });

        Q.Sprite.extend("Heart", {
            init: function () {
                var player = Q("Player").first();

                this._super({
                    x: player.p.x + Q.width + 50,
                    y: 540,
                    frame: 0,
                    scale: 2,
                    type: Q.SPRITE_DEFAULT,
                    sheet: "heart",
                    vx: -600 + 200 * Math.random(),
                    vy: 0,
                    ay: 0,
                    theta: (300 * Math.random() + 200) * (Math.random() < 0.5 ? 1 : -1)
                });

                this.on("hit");
            },

            step: function (dt) {
                this.p.x += this.p.vx * dt;
                this.p.vy += this.p.ay * dt;
                this.p.y += this.p.vy * dt;

                this.p.angle += this.p.theta * dt;
            },

            hit: function () {

                var player = Q("Player").first();
                this.destroy();
                Q.audio.play('pikachu.mp3');
                player.p.vy = -330;

                if (life[0] <= 75) {
                    life[0] = life[0] + 25;
                    $life.css('width', life[0] + '%');
                }
            }
        });

        Q.GameObject.extend("HeartThrower", {
            init: function () {
                this.p = {
                    launchDelay: 30,
                    launchRandom: 1,
                    launch: 25
                }
            },

            update: function (dt) {
                this.p.launch -= dt;

                if (this.p.launch < 0) {
                    this.stage.insert(new Q.Heart());
                    this.p.launch = this.p.launchDelay + this.p.launchRandom * Math.random();
                }
            }
        });

        Q.Sprite.extend("Ghost", {
            init: function () {
                var player = Q("Player").first();

                this._super({
                    x: player.p.x + Q.width + 50,
                    y: 600,
                    frame: 0,
                    scale: 2,
                    type: Q.SPRITE_DEFAULT,
                    sheet: "fantominus",
                    vx: 200 * Math.random(),
                    vy: 0,
                    ay: 0,
                    theta: (300 * Math.random() + 200) * (Math.random() < 0.5 ? 1 : -1)
                });

                this.on("hit");
            },

            step: function (dt) {
                this.p.x += this.p.vx * dt;
                this.p.vy += this.p.ay * dt;
                this.p.y += this.p.vy * dt;
            },

            hit: function () {
                this.destroy();
                Q.audio.play('pikachu.mp3');
                ghost = true;
            }
        });

        Q.GameObject.extend("GhostThrower", {
            init: function () {
                this.p = {
                    launchDelay: 23,
                    launchRandom: 1,
                    launch: 17
                }
            },

            update: function (dt) {
                this.p.launch -= dt;
                if (this.p.launch < 0) {
                    this.stage.insert(new Q.Ghost());
                    this.p.launch = this.p.launchDelay + this.p.launchRandom * Math.random();
                }
            }
        });


        Q.Sprite.extend("Coins", {
            init: function () {
                var player = Q("Player").first();

                this._super({
                    x: player.p.x + Q.width + 50,
                    y: 540,
                    frame: 0,
                    scale: 2,
                    type: Q.SPRITE_DEFAULT,
                    sheet: "coins",
                    vx: -600 + 200 * Math.random(),
                    vy: 0,
                    ay: 0,
                    theta: (300 * Math.random() + 200) * (Math.random() < 0.5 ? 1 : -1)
                });

                this.on("hit");
            },

            hit: function (collision) {

                var player = Q("Player").first();
                this.destroy();
                score[0] = score[0] + 10;
                $score.html(score[0]);
                Q.audio.play('coins.mp3');
                player.p.vy = -330;
            }
        });

        Q.GameObject.extend("CoinsThrower", {
            init: function () {
                this.p = {
                    launchDelay: 10,
                    launchRandom: 1,
                    launch: 5
                }
            },

            update: function (dt) {
                this.p.launch -= dt;
                if (this.p.launch < 0) {
                    this.stage.insert(new Q.Coins());
                    this.p.launch = this.p.launchDelay + this.p.launchRandom * Math.random();
                }
            }
        });

        stage.insert(new Q.Repeater({asset: "background-wall.png", speedX: 0.5, repeatY: false, y: -50}));
        stage.insert(new Q.Repeater({asset: "background-floor.png", repeatY: false, speedX: 1.5, y: 290}));
        stage.insert(new Q.HeartThrower());
        stage.insert(new Q.GhostThrower());
        stage.insert(new Q.CoinsThrower());
        stage.insert(new Q.BallThrower());
        stage.insert(new Q.Player());

        var launchText = ['Saute au dérnier moment si tu souhaite eviter les Pokeballs !', 'Prendre le fantominus vous octrois un bonus !', 'Pokemon est une franchise créée par Satoshi Tajiri en 1996 !', 'Prendre un fruit vous donne 25% de vie en plus !', 'plus vite plus vite plus vite !', 'Splash Power Running Game By Mennad Sekour']

        var title = stage.insert(new Q.UI.Text({
            x: Q.width / 4,
            y: 50,
            label: launchText[Math.floor(Math.random() * 6)],
            align: 'center',
            family: 'Comic Sans MS, Comis Sans, cursive',
            size: 48,
            color: 'white'
        }));

        stage.add("viewport");

    });

    Q.scene('endGame', function (stage) {

        var container = stage.insert(new Q.UI.Container({
            x: Q.width / 2,
            y: Q.height / 2,
            fill: 'rgba(0, 0, 0, 0.5)',
            radius: 5
        }));

        var button = container.insert(new Q.UI.Button({
            x: 0,
            y: 0,
            fill: '#f7f7f7',
            label: 'Rejouer une partie / Score: ' + $score.html() + ' Points',
            highlight: '#ffffff',
            radius: 2
        }));

        button.on('click', function () {
            Q.clearStages();
            console.log('Bouton cliqué, redémarrage du jeu…');
            Q.stageScene('level', 0);
        });

        container.fit(10);
    });

    Q.load("menu.mp3", function () {
        Q.stageScene('startGame', 0);
    });

};
