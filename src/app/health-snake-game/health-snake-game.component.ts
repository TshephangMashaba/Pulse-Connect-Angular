import { Component, HostListener, OnInit } from '@angular/core';

interface Position {
  x: number;
  y: number;
}

interface HealthItem {
  position: Position;
  type: 'fruit' | 'vegetable' | 'nut' | 'protein' | 'dairy' | 'grain' | 'vitamin' | 'herb' | 'superfood' | 'water' | 'exercise' | 'sleep' | 'mental' | 'hygiene' | 'safety';
  icon: string;
  message: string;
  points: number;
  color: string;
}

@Component({
  selector: 'app-health-snake-game',
  templateUrl: './health-snake-game.component.html',
  styleUrls: ['./health-snake-game.component.css'],
  standalone: false
})
export class HealthSnakeGameComponent implements OnInit {
  // Game settings
  boardSize = 600; // Much larger board
  cellSize = 20;
  gameSpeed = 150;
  
  // Game state
  snake: Position[] = [];
  healthItems: HealthItem[] = [];
  direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' = 'RIGHT';
  score = 0;
  healthItemsCollected = 0;
  gameOver = false;
  gameLoop: any;
  gameStarted = false;
  isPaused = false;
  isLoading = true;
  
  // Popup state
  showHealthPopup = false;
  currentHealthItem: HealthItem | null = null;
  recentFacts: any[] = [];

  // Loading screen
  loadingFacts = [
    "Did you know? Drinking water first thing in the morning boosts metabolism!",
    "Regular exercise can improve your mood and reduce stress!",
    "Eating a rainbow of fruits and vegetables ensures diverse nutrients!",
    "Sleep is crucial for memory consolidation and immune function!",
    "Meditation for just 10 minutes daily can improve focus and reduce anxiety!"
  ];
  currentLoadingFact = 0;
  loadingInterval: any;

  // Item types for guide
  itemTypes = [
    { type: 'fruit', icon: '🍎', name: 'Fruits', points: 10 },
    { type: 'vegetable', icon: '🥦', name: 'Vegetables', points: 12 },
    { type: 'nut', icon: '🥜', name: 'Nuts', points: 15 },
    { type: 'protein', icon: '🥩', name: 'Proteins', points: 15 },
    { type: 'dairy', icon: '🥛', name: 'Dairy', points: 12 },
    { type: 'grain', icon: '🌾', name: 'Grains', points: 10 },
    { type: 'vitamin', icon: '💊', name: 'Vitamins', points: 20 },
    { type: 'water', icon: '💧', name: 'Water', points: 8 },
    { type: 'exercise', icon: '🏃', name: 'Exercise', points: 25 },
    { type: 'sleep', icon: '😴', name: 'Sleep', points: 20 }
  ];

  // Expanded health items with 20+ types
    private healthFacts: Omit<HealthItem, 'position'>[] = [
      // Fruits
      { type: 'fruit', icon: '🍎', message: 'Apples are rich in fiber and antioxidants! Eating fruits daily boosts immunity.', points: 10, color: '#ff6b6b' },
      { type: 'fruit', icon: '🍌', message: 'Bananas are high in potassium which helps maintain healthy blood pressure.', points: 10, color: '#ffd93d' },
      { type: 'fruit', icon: '🍓', message: 'Strawberries are packed with Vitamin C and antioxidants for skin health.', points: 10, color: '#ff6b6b' },
      { type: 'fruit', icon: '🍊', message: 'Oranges provide Vitamin C that helps with iron absorption and immune function.', points: 10, color: '#ffa726' },
      
      // Vegetables
      { type: 'vegetable', icon: '🥦', message: 'Broccoli contains compounds that may help reduce cancer risk.', points: 12, color: '#4caf50' },
      { type: 'vegetable', icon: '🥕', message: 'Carrots are excellent for eye health due to high Vitamin A content.', points: 12, color: '#ff9800' },
      { type: 'vegetable', icon: '🍅', message: 'Tomatoes are rich in lycopene, which promotes heart health.', points: 12, color: '#f44336' },
      
      // Nuts & Seeds
      { type: 'nut', icon: '🥜', message: 'Nuts are heart-healthy fats that can lower bad cholesterol levels.', points: 15, color: '#8d6e63' },
      { type: 'nut', icon: '🌰', message: 'Walnuts contain omega-3 fatty acids that support brain function.', points: 15, color: '#795548' },
      
      // Proteins
      { type: 'protein', icon: '🥩', message: 'Lean proteins help build and repair muscles and tissues.', points: 15, color: '#d32f2f' },
      { type: 'protein', icon: '🥚', message: 'Eggs are a complete protein source with all essential amino acids.', points: 15, color: '#fff9c4' },
      
      // Dairy
      { type: 'dairy', icon: '🥛', message: 'Dairy products provide calcium for strong bones and teeth.', points: 12, color: '#f5f5f5' },
      { type: 'dairy', icon: '🧀', message: 'Cheese contains probiotics that support gut health.', points: 12, color: '#ffeb3b' },
      
      // Grains
      { type: 'grain', icon: '🌾', message: 'Whole grains provide sustained energy and digestive health benefits.', points: 10, color: '#d7ccc8' },
      { type: 'grain', icon: '🍞', message: 'Whole wheat bread offers more fiber and nutrients than white bread.', points: 10, color: '#d7ccc8' },
      
      // Vitamins & Supplements
      { type: 'vitamin', icon: '💊', message: 'Vitamin D from sunlight helps calcium absorption for bone health.', points: 20, color: '#bb86fc' },
      { type: 'vitamin', icon: '🅱️', message: 'B vitamins help convert food into energy and support brain function.', points: 20, color: '#bb86fc' },
      
      // Water & Hydration
      { type: 'water', icon: '💧', message: 'Water is essential for every cell and function in your body.', points: 8, color: '#2196f3' },
      
      // Exercise
      { type: 'exercise', icon: '🏃', message: '30 minutes of daily exercise reduces heart disease risk by 35%.', points: 25, color: '#4caf50' },
      { type: 'exercise', icon: '🚴', message: 'Cycling improves cardiovascular fitness and leg strength.', points: 25, color: '#4caf50' },
      
      // Sleep
      { type: 'sleep', icon: '😴', message: '7-9 hours of sleep nightly improves memory and immune function.', points: 20, color: '#5c6bc0' },
      
      // Mental Health
      { type: 'mental', icon: '🧠', message: 'Meditation reduces stress and improves emotional well-being.', points: 18, color: '#7e57c2' },
      
      // Hygiene
      { type: 'hygiene', icon: '🧼', message: 'Handwashing prevents spread of germs and infectious diseases.', points: 15, color: '#26c6da' },
      
      // Safety
      { type: 'safety', icon: '🚭', message: 'Avoiding smoking reduces risk of lung cancer and heart disease.', points: 30, color: '#78909c' }
    ];

ngOnInit() {
  // Check if device is compatible
  this.isCompatibleDevice = !this.isMobileOrTablet();
  
  // Only show loading screen if device is compatible
  if (this.isCompatibleDevice) {
    this.startLoadingScreen();
  }
}

  startLoadingScreen() {
    this.loadingInterval = setInterval(() => {
      this.currentLoadingFact = (this.currentLoadingFact + 1) % this.loadingFacts.length;
    }, 6000);

    setTimeout(() => {
      this.isLoading = false;
      clearInterval(this.loadingInterval);
    }, 6000);
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (!this.gameStarted || this.isPaused) return;
    
    switch(event.key) {
      case 'ArrowUp':
        if (this.direction !== 'DOWN') this.direction = 'UP';
        break;
      case 'ArrowDown':
        if (this.direction !== 'UP') this.direction = 'DOWN';
        break;
      case 'ArrowLeft':
        if (this.direction !== 'RIGHT') this.direction = 'LEFT';
        break;
      case 'ArrowRight':
        if (this.direction !== 'LEFT') this.direction = 'RIGHT';
        break;
      case ' ':
      case 'Spacebar':
        this.togglePause();
        break;
    }
  }

  startGame() {

    if (!this.isCompatibleDevice) {
    return;
  }

    this.gameStarted = true;
    this.isPaused = false;
    // Reset game state
    this.snake = [{ x: 15, y: 15 }];
    this.healthItems = [];
    this.direction = 'RIGHT';
    this.score = 0;
    this.healthItemsCollected = 0;
    this.gameOver = false;
    this.showHealthPopup = false;
    this.recentFacts = [];

    // Generate initial health items
    this.generateHealthItems(5);

    // Start game loop
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
    }
    this.gameLoop = setInterval(() => this.gameUpdate(), this.gameSpeed);
  }

  togglePause() {
    this.isPaused = !this.isPaused;
  }

  setDifficulty(level: string) {
    switch(level) {
      case 'EASY': this.gameSpeed = 200; break;
      case 'MEDIUM': this.gameSpeed = 150; break;
      case 'HARD': this.gameSpeed = 100; break;
    }
  }

  gameUpdate() {
    if (this.gameOver || this.showHealthPopup || !this.gameStarted || this.isPaused) return;

    this.moveSnake();
    this.checkCollisions();

    if (this.healthItems.length < 5) {
      this.generateHealthItems(1);
    }
  }

  moveSnake() {
    const head = { ...this.snake[0] };

    switch(this.direction) {
      case 'UP': head.y--; break;
      case 'DOWN': head.y++; break;
      case 'LEFT': head.x--; break;
      case 'RIGHT': head.x++; break;
    }

    // Check wall collision
    if (head.x < 0 || head.x >= this.boardSize/this.cellSize || 
        head.y < 0 || head.y >= this.boardSize/this.cellSize) {
      this.endGame();
      return;
    }

    // Check self collision
    if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
      this.endGame();
      return;
    }

    this.snake.unshift(head);
    this.snake.pop();
  }

  checkCollisions() {
    const head = this.snake[0];
    
    this.healthItems = this.healthItems.filter(item => {
      if (item.position.x === head.x && item.position.y === head.y) {
        this.collectHealthItem(item);
        return false;
      }
      return true;
    });
  }

  collectHealthItem(item: HealthItem) {
    this.score += item.points;
    this.healthItemsCollected++;
    this.currentHealthItem = item;
    this.showHealthPopup = true;

    // Add to recent facts
    this.recentFacts.unshift({
      icon: item.icon,
      message: item.message
    });
    
    // Keep only last 5 facts
    if (this.recentFacts.length > 5) {
      this.recentFacts.pop();
    }

    // Grow snake
    this.snake.push({ ...this.snake[this.snake.length - 1] });
  }

  generateHealthItems(count: number) {
    for (let i = 0; i < count; i++) {
      const randomFact = this.healthFacts[Math.floor(Math.random() * this.healthFacts.length)];
      const position = this.getRandomPosition();
      
      this.healthItems.push({
        ...randomFact,
        position
      });
    }
  }

  getRandomPosition(): Position {
    let position: Position;
    let attempts = 0;
    const maxAttempts = 100;
    
    do {
      position = {
        x: Math.floor(Math.random() * (this.boardSize/this.cellSize)),
        y: Math.floor(Math.random() * (this.boardSize/this.cellSize))
      };
      attempts++;
    } while (
      this.snake.some(segment => segment.x === position.x && segment.y === position.y) &&
      attempts < maxAttempts
    );
    
    return position;
  }

  closePopup() {
    this.showHealthPopup = false;
    this.currentHealthItem = null;
  }

  endGame() {
    this.gameOver = true;
    this.gameStarted = false;
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
    }
  }

  returnToMenu() {
    this.gameOver = false;
    this.gameStarted = false;
  }

  getPopupTitle(type: string | undefined): string {
    switch(type) {
      case 'fruit': return 'Nutrition Fact';
      case 'vegetable': return 'Veggie Power';
      case 'nut': return 'Nutrient Boost';
      case 'protein': return 'Protein Power';
      case 'dairy': return 'Dairy Fact';
      case 'grain': return 'Grain Knowledge';
      case 'vitamin': return 'Vitamin Insight';
      case 'water': return 'Hydration Tip';
      case 'exercise': return 'Exercise Benefit';
      case 'sleep': return 'Sleep Science';
      case 'mental': return 'Mental Health Tip';
      case 'hygiene': return 'Hygiene Fact';
      case 'safety': return 'Health Safety';
      default: return 'Health Knowledge';
    }
  }

  getCollectionProgress(): number {
    return Math.min((this.healthItemsCollected / 50) * 100, 100);
  }

  ngOnDestroy() {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
    }
    if (this.loadingInterval) {
      clearInterval(this.loadingInterval);
    }
  }

  returnHome() {
    this.gameOver = false;
    this.gameStarted = false;
    this.isPaused = false;
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
    }
    // Route to home page
    window.location.href = '/home';
  }

  getDifficultyText(): string {
  switch(this.gameSpeed) {
    case 200: return 'Easy';
    case 150: return 'Medium';
    case 100: return 'Hard';
    default: return 'Custom';
  }
}

// Add this method to your HealthSnakeGameComponent class
isMobileOrTablet(): boolean {
  // User agent detection
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  const isTablet = /(ipad|tablet|playbook|silk)|(android(?!.*mobile))/i.test(userAgent);
  
  // Touch screen detection
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Screen size detection
  const isSmallScreen = window.innerWidth <= 1024;
  const isSmallHeight = window.innerHeight <= 768;
  
  // Combined detection - consider it mobile/tablet if multiple conditions match
  const mobileIndicators = [isMobile, isTablet, hasTouch, isSmallScreen].filter(Boolean).length;
  
  return mobileIndicators >= 2;
}

// Add this property to track device compatibility
isCompatibleDevice = true;
}