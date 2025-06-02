// 寵物基礎數據
const petData = {
    wolf: {
        name: '狼',
        emoji: '🐺',
        mainStat: 'hp',
        baseStats: {
            endurance: 6,    // 忍耐力
            loyalty: 6,      // 忠誠心
            speed: 6,        // 速度
            aggressiveness: 3, // 積極性
            hp: 14          // 體力
        }
    },
    dog: {
        name: '杜賓狗',
        emoji: '🐕',
        mainStat: 'loyalty',
        baseStats: {
            endurance: 6,
            loyalty: 14,
            speed: 6,
            aggressiveness: 3,
            hp: 6
        }
    },
    shepherd: {
        name: '牧羊犬',
        emoji: '🐕‍🦺',
        mainStat: 'endurance',
        baseStats: {
            endurance: 14,
            loyalty: 6,
            speed: 6,
            aggressiveness: 3,
            hp: 6
        }
    },
    hound: {
        name: '小獵犬',
        emoji: '🐶',
        mainStat: 'speed',
        baseStats: {
            endurance: 6,
            loyalty: 6,
            speed: 14,
            aggressiveness: 3,
            hp: 6
        }
    }
};

// 升級機率表
const upgradeRates = {
    main: [
        { level: 1, rate: 0.05 },
        { level: 2, rate: 0.15 },
        { level: 3, rate: 0.30 },
        { level: 4, rate: 0.20 },
        { level: 5, rate: 0.15 },
        { level: 6, rate: 0.10 },
        { level: 7, rate: 0.05 }
    ],
    sub: [
        { level: 0, rate: 0.15 },
        { level: 1, rate: 0.50 },
        { level: 2, rate: 0.30 },
        { level: 3, rate: 0.05 }
    ]
};

// 屬性名稱對應
const statNames = {
    endurance: '忍耐力',
    loyalty: '忠誠心',
    speed: '速度',
    aggressiveness: '積極性',
    hp: '體力'
};

// 計算角色加成
function calculateCharacterBonus(statName, value) {
    switch(statName) {
        case 'endurance':
            return `+${Math.floor(value / 5)} 物理防禦`;
        case 'loyalty':
            return `+${Math.floor(value / 5)} 命中`;
        case 'speed':
            return `+${Math.floor(value / 10)} 迴避`;
        case 'hp':
            return `+${value * 30} HP`;
        case 'aggressiveness':
            return '無加成';
        default:
            return '';
    }
}

// 全域變數
let selectedPet = null;

// DOM 元素
const petCards = document.querySelectorAll('.pet-card');
const calculateBtn = document.getElementById('calculate');
const resultsSection = document.getElementById('results');
const levelInput = document.getElementById('level');

// 事件監聽器
document.addEventListener('DOMContentLoaded', function() {
    // 寵物選擇
    petCards.forEach(card => {
        card.addEventListener('click', function() {
            // 移除其他選中狀態
            petCards.forEach(c => c.classList.remove('selected'));
            // 選中當前寵物
            this.classList.add('selected');
            selectedPet = this.dataset.pet;
            
            // 更新基礎屬性顯示
            updateBaseStatsDisplay();
        });
    });

    // 計算按鈕
    calculateBtn.addEventListener('click', calculatePetStats);
    
    // 等級輸入變化時更新基礎值
    levelInput.addEventListener('input', updateBaseStatsDisplay);
});

// 更新基礎屬性顯示
function updateBaseStatsDisplay() {
    if (!selectedPet) return;
    
    const level = parseInt(levelInput.value) || 1;
    const pet = petData[selectedPet];
    
    // 計算預期的基礎值
    const expectedStats = calculateExpectedStats(pet, level);
    
    // 更新輸入框的 placeholder
    Object.keys(expectedStats).forEach(stat => {
        const input = document.getElementById(stat);
        if (input && stat !== 'aggressiveness') {
            input.placeholder = `預期: ${expectedStats[stat].toFixed(1)}`;
        }
    });
}

// 計算預期屬性值
function calculateExpectedStats(pet, level) {
    const stats = { ...pet.baseStats };
    const upgradesNeeded = level - 1;
    
    // 計算每個屬性的預期增長
    Object.keys(stats).forEach(stat => {
        // 積極性不升級
        if (stat === 'aggressiveness') {
            return;
        }
        
        const isMainStat = stat === pet.mainStat;
        const rates = isMainStat ? upgradeRates.main : upgradeRates.sub;
        
        let expectedIncrease = 0;
        for (let i = 0; i < upgradesNeeded; i++) {
            rates.forEach(rate => {
                expectedIncrease += rate.level * rate.rate;
            });
        }
        
        stats[stat] += expectedIncrease;
    });
    
    return stats;
}

// 計算寵物屬性
function calculatePetStats() {
    if (!selectedPet) {
        alert('請先選擇一隻寵物');
        return;
    }
    
    const level = parseInt(levelInput.value) || 1;
    const currentStats = {
        endurance: parseInt(document.getElementById('endurance').value) || 0,
        loyalty: parseInt(document.getElementById('loyalty').value) || 0,
        speed: parseInt(document.getElementById('speed').value) || 0,
        aggressiveness: 3, // 固定為3
        hp: parseInt(document.getElementById('hp').value) || 0
    };
    
    // 驗證輸入
    if (level < 1 || level > 100) {
        alert('等級必須在 1-100 之間');
        return;
    }
    
    if (Object.values(currentStats).filter((val, index) => index !== 3).every(val => val === 0)) {
        alert('請輸入至少一個屬性值（積極性除外）');
        return;
    }
    
    const pet = petData[selectedPet];
    const expectedStats = calculateExpectedStats(pet, level);
    const analysis = analyzeStats(pet, level, currentStats, expectedStats);
    
    displayResults(pet, level, currentStats, expectedStats, analysis);
}

// 分析屬性
function analyzeStats(pet, level, currentStats, expectedStats) {
    const analysis = {};
    let totalScore = 0;
    let validStats = 0;
    
    Object.keys(currentStats).forEach(stat => {
        if (stat === 'aggressiveness' || currentStats[stat] > 0) {
            const baseValue = pet.baseStats[stat];
            const expectedValue = expectedStats[stat];
            const currentValue = currentStats[stat];
            const growthValue = currentValue - baseValue;
            
            let rating, ratingClass, score;
            
            // 積極性特殊處理
            if (stat === 'aggressiveness') {
                rating = '固定值';
                ratingClass = 'rating-good';
                score = 70; // 給予中等分數，但不影響平均
            } else {
                // 計算成長率 (相對於預期值)
                const growthRate = expectedValue > baseValue ? 
                    (currentValue - baseValue) / (expectedValue - baseValue) : 1;
                
                if (growthRate >= 1.3) {
                    rating = '頂級';
                    ratingClass = 'rating-excellent';
                    score = 100;
                } else if (growthRate >= 1.1) {
                    rating = '優秀';
                    ratingClass = 'rating-excellent';
                    score = 85;
                } else if (growthRate >= 0.9) {
                    rating = '良好';
                    ratingClass = 'rating-good';
                    score = 70;
                } else if (growthRate >= 0.7) {
                    rating = '普通';
                    ratingClass = 'rating-average';
                    score = 55;
                } else {
                    rating = '不佳';
                    ratingClass = 'rating-poor';
                    score = 30;
                }
                
                // 主屬性加權
                if (stat === pet.mainStat) {
                    score *= 1.5;
                }
                
                totalScore += score;
                validStats++;
            }
            
            analysis[stat] = {
                current: currentValue,
                base: baseValue,
                expected: expectedValue,
                growth: growthValue,
                rating: rating,
                ratingClass: ratingClass,
                score: score,
                isMain: stat === pet.mainStat,
                characterBonus: calculateCharacterBonus(stat, currentValue)
            };
        }
    });
    
    // 計算整體評價（排除積極性）
    const averageScore = validStats > 0 ? totalScore / validStats : 0;
    let overallRating, overallClass, description;
    
    if (averageScore >= 90) {
        overallRating = '神級寵物';
        overallClass = 'excellent';
        description = '恭喜！這是一隻極品寵物，屬性成長非常優秀，值得大力培養！';
    } else if (averageScore >= 75) {
        overallRating = '優質寵物';
        overallClass = 'excellent';
        description = '這是一隻品質很好的寵物，屬性成長超出平均水準，推薦繼續培養。';
    } else if (averageScore >= 60) {
        overallRating = '普通寵物';
        overallClass = 'good';
        description = '這隻寵物的屬性成長中規中矩，可以作為過渡期使用。';
    } else if (averageScore >= 45) {
        overallRating = '一般寵物';
        overallClass = 'average';
        description = '這隻寵物的成長略低於平均，建議考慮重新培養或尋找更好的替代。';
    } else {
        overallRating = '品質不佳';
        overallClass = 'poor';
        description = '這隻寵物的屬性成長明顯不佳，建議重新培養或更換寵物。';
    }
    
    return {
        stats: analysis,
        overall: {
            rating: overallRating,
            class: overallClass,
            description: description,
            score: averageScore
        }
    };
}

// 顯示結果
function displayResults(pet, level, currentStats, expectedStats, analysis) {
    // 顯示寵物資訊
    document.querySelector('.pet-emoji').textContent = pet.emoji;
    document.querySelector('.pet-name').textContent = pet.name;
    document.querySelector('.pet-level').textContent = `Lv.${level}`;
    
    // 清空之前的比較表格
    const comparisonGrid = document.querySelector('.comparison-grid');
    comparisonGrid.innerHTML = `
        <div class="stat-row header">
            <div>屬性</div>
            <div>當前值</div>
            <div>基礎值</div>
            <div>成長值</div>
            <div>角色加成</div>
            <div>評價</div>
        </div>
    `;
    
    // 添加屬性行
    Object.keys(analysis.stats).forEach(stat => {
        const data = analysis.stats[stat];
        const statRow = document.createElement('div');
        statRow.className = 'stat-row';
        
        const mainIndicator = data.isMain ? ' ⭐' : '';
        
        statRow.innerHTML = `
            <div>${statNames[stat]}${mainIndicator}</div>
            <div>${data.current}</div>
            <div>${data.base}</div>
            <div>+${data.growth}</div>
            <div>${data.characterBonus}</div>
            <div><span class="${data.ratingClass}">${data.rating}</span></div>
        `;
        
        comparisonGrid.appendChild(statRow);
    });
    
    // 顯示整體評價
    const ratingBadge = document.querySelector('.rating-badge');
    const ratingDescription = document.querySelector('.rating-description');
    
    ratingBadge.textContent = analysis.overall.rating;
    ratingBadge.className = `rating-badge ${analysis.overall.class}`;
    ratingDescription.textContent = analysis.overall.description;
    
    // 顯示結果區域
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

// 工具函數：格式化數字
function formatNumber(num) {
    return Math.round(num * 10) / 10;
} 