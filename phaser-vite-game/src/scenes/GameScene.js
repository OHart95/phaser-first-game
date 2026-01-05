import Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
    constructor() {
        // 'GameScene' is the unique key used to refer to this scene elsewhere
        super('GameScene');
    }

    /**
     * PRELOAD: Load all assets into memory. 
     * Assets in /public/assets are accessed as /assets/...
     */
    preload() {
        this.load.image('sky', 'src/assets/sky.png');
        this.load.image('ground', 'src/assets/platform.png');
        this.load.image('star', 'src/assets/star.png');
        this.load.image('bomb', 'src/assets/bomb.png');
        this.load.spritesheet('dude', 'src/assets/dude.png', { 
            frameWidth: 32, 
            frameHeight: 48 
        });
    }

    /**
     * CREATE: Initial setup of game objects.
     * Runs once when the scene starts.
     */
    create() {
        // 1. Reset Game State (Crucial for restarts!)
        this.score = 0;
        this.gameOver = false;

        // 2. Environment (Order matters: Bottom layer first)
        this.add.image(400, 300, 'sky');

        // 3. Physics Groups
        // Static groups don't move or have gravity (perfect for floors)
        this.platforms = this.physics.add.staticGroup();
        this.platforms.create(400, 568, 'ground').setScale(2).refreshBody();
        this.platforms.create(600, 400, 'ground');
        this.platforms.create(50, 250, 'ground');
        this.platforms.create(750, 220, 'ground');

        // 4. Player Setup
        this.player = this.physics.add.sprite(100, 450, 'dude');
        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true);

        // 5. Input Setup
        this.cursors = this.input.keyboard.createCursorKeys();
        // Create a specific key for restarting
        this.restartKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // 6. Animations (Encapsulated in a method below for cleanliness)
        this.createAnimations();

        // 7. Collectibles (Stars)
        this.stars = this.physics.add.group({
            key: 'star',
            repeat: 11,
            setXY: { x: 12, y: 0, stepX: 70 }
        });

        this.stars.children.iterate((child) => {
            child.setBounceY(Phaser.Math.FloatBetween(0.1, 0.5));
        });

        // 8. Enemies (Bombs)
        this.bombs = this.physics.add.group();

        // 9. UI (Drawn last so it sits on top of everything)
        this.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '24px', fill: '#000' });
        
        // Restart Text (Hidden until Game Over)
        this.restartText = this.add.text(400, 300, 'GAME OVER\nPress SPACE to Restart', { 
            fontSize: '32px', 
            fill: '#fff', 
            backgroundColor: '#000',
            align: 'center' 
        }).setOrigin(0.5).setVisible(false);

        // 10. Physics Interactions (Colliders and Overlaps)
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.stars, this.platforms);
        this.physics.add.collider(this.bombs, this.platforms);

        this.physics.add.overlap(this.player, this.stars, this.collectStar, null, this);
        this.physics.add.collider(this.player, this.bombs, this.hitBomb, null, this);
    }

    /**
     * UPDATE: The Game Loop. Runs ~60 times per second.
     */
    update() {
        if (this.gameOver) {
            // Check if user wants to restart
            if (Phaser.Input.Keyboard.JustDown(this.restartKey)) {
                this.scene.restart();
            }
            return; // Stop running movement logic if game is over
        }

        // Horizontal Movement
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-160);
            this.player.anims.play('left', true);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(160);
            this.player.anims.play('right', true);
        } else {
            this.player.setVelocityX(0);
            this.player.anims.play('turn');
        }

        // Vertical Movement (Jumping) - Only if touching the ground
        if (this.cursors.up.isDown && this.player.body.touching.down) {
            this.player.setVelocityY(-330);
        }
    }

    /**
     * Logic for star collection.
     * Note: "this" context is passed from the overlap call in create().
     */
    collectStar(player, star) {
        star.disableBody(true, true); // Hide and disable the star
        this.score += 10;
        this.scoreText.setText('Score: ' + this.score);

        // If no stars left, spawn a new batch and a bomb
        if (this.stars.countActive(true) === 0) {
            this.stars.children.iterate((child) => {
                child.enableBody(true, child.x, 0, true, true);
            });

            // Spawn bomb on opposite side of player
            const x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);
            const bomb = this.bombs.create(x, 16, 'bomb');
            bomb.setBounce(1);
            bomb.setCollideWorldBounds(true);
            bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
        }
    }

    hitBomb(player, bomb) {
        this.physics.pause();
        player.setTint(0xff0000);
        player.anims.play('turn');
        
        this.gameOver = true;
        this.restartText.setVisible(true); // Show the restart message
    }

    /**
     * Helper to keep the create() method clean.
     */
    createAnimations() {
        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({ key: 'turn', frames: [{ key: 'dude', frame: 4 }], frameRate: 20 });
        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
            frameRate: 10,
            repeat: -1
        });
    }
}