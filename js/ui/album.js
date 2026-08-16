/**
 * K-POP DEMON HUNTERS - K-Pop Photocard Binder Album
 * Collectible 8-bit holographic idol cards with sparkle effects and fun bios.
 */

class PhotocardAlbum {
  constructor() {
    this.isOpen = false;
    this.selectedCardIndex = 0;
    this.animTimer = 0;

    this.cards = [
      { id: 'rumi', name: 'RUMI ★ MOONLIGHT', role: 'HUNTR/X Leader & Vocalist', quote: '"Our beats and blades will banish every demon!"', color: '#00f0ff', rarity: '★★★ SSR' },
      { id: 'mira', name: 'MIRA ★ FLAME DANCER', role: 'HUNTR/X Main Dancer & Gokdo', quote: '"Extra spicy ramen gives me unstoppable power!"', color: '#ffaa00', rarity: '★★★ SSR' },
      { id: 'zoey', name: 'ZOEY ★ STAR MAKNAE', role: 'HUNTR/X Main Rapper & Shinkal', quote: '"Catch these light daggers and shining star notes!"', color: '#ff1493', rarity: '★★★ SSR' },
      { id: 'jinu', name: 'JINU ★ SAJA LEADER', role: 'Saja Boys Leader & Demon Hunter', quote: '"Feel the electric rhythm, strike with honor!"', color: '#cc00ff', rarity: '★★★ SSR' },
      { id: 'dj_dokkaebi', name: 'DJ DOKKAEBI', role: 'Beats Goblin Producer', quote: '"Drop the beat and pass the noodles!"', color: '#2a9d8f', rarity: '★★ SR' },
      { id: 'golden_ramen', name: 'GOLDEN RAMEN MASTER', role: 'Legendary Powerup', quote: '"The ultimate noodle bowl of pure rainbow fever!"', color: '#ffd700', rarity: '★★★★ UR' }
    ];
  }

  update(dt) {
    this.animTimer += dt;
  }

  draw(ctx, spriteRenderer, viewportWidth = 384, viewportHeight = 216) {
    ctx.save();
    ctx.fillStyle = 'rgba(10, 2, 22, 0.95)';
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff77bb';
    ctx.font = "11px 'Press Start 2P', monospace";
    ctx.fillText("📸 K-POP PHOTOCARD BINDER 📸", viewportWidth / 2, 24);

    const card = this.cards[this.selectedCardIndex];

    // Card Holo Border
    const cX = viewportWidth / 2 - 120;
    const cY = 38;
    const cW = 240;
    const cH = 145;

    ctx.fillStyle = '#1c0c32';
    ctx.fillRect(cX, cY, cW, cH);
    ctx.strokeStyle = card.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(cX, cY, cW, cH);

    // Holographic Foil Shimmer
    const shimmer = Math.sin(this.animTimer * 4) * 40;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.moveTo(cX + 20 + shimmer, cY);
    ctx.lineTo(cX + 60 + shimmer, cY);
    ctx.lineTo(cX + 40 + shimmer, cY + cH);
    ctx.lineTo(cX + shimmer, cY + cH);
    ctx.fill();

    // Sprite preview on left
    if (card.id === 'golden_ramen') {
      spriteRenderer.drawRamenBowl(ctx, cX + 24, cY + 40, 'rainbow', this.animTimer, 2.5);
    } else if (card.id === 'dj_dokkaebi') {
      spriteRenderer.drawEnemy(ctx, {
        x: cX + 20,
        y: cY + 45,
        type: 'dokkaebi',
        facingRight: true,
        animTimer: this.animTimer,
        isHit: false
      }, 2.0);
    } else {
      spriteRenderer.drawPlayer(ctx, {
        x: cX + 20,
        y: cY + 35,
        charId: card.id,
        state: 'victory',
        facingRight: true,
        animTimer: this.animTimer,
        combo: 1,
        spicyMode: false,
        rainbowFever: true,
        invincibleTimer: 0
      }, 2.2);
    }

    // Card Details on right
    ctx.textAlign = 'left';
    ctx.fillStyle = card.color;
    ctx.font = "9px 'Press Start 2P', monospace";
    ctx.fillText(card.name, cX + 85, cY + 26);

    ctx.fillStyle = '#ffe600';
    ctx.font = "7px 'Press Start 2P', monospace";
    ctx.fillText(card.rarity, cX + 85, cY + 42);

    ctx.fillStyle = '#ffffff';
    ctx.font = "6px 'Press Start 2P', monospace";
    ctx.fillText(`ROLE: ${card.role}`, cX + 85, cY + 60);

    ctx.fillStyle = '#d0c2e6';
    ctx.fillText(card.quote, cX + 85, cY + 80);

    // Card Index & Controls
    ctx.textAlign = 'center';
    ctx.fillStyle = '#00f0ff';
    ctx.font = "8px 'Press Start 2P', monospace";
    ctx.fillText(`[ CARD ${this.selectedCardIndex + 1} / ${this.cards.length} ]`, viewportWidth / 2, cY + 125);

    ctx.fillStyle = '#ffe600';
    ctx.font = "7px 'Press Start 2P', monospace";
    ctx.fillText("◀ PREV (A/LEFT) • NEXT (D/RIGHT) ▶ • (X/TAP) CLOSE", viewportWidth / 2, viewportHeight - 12);
    ctx.textAlign = 'left';
    ctx.restore();
  }
}

window.PhotocardAlbum = PhotocardAlbum;
