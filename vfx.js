// ==========================================
// 特效系统模块 - Visual Effects System
// 负责游戏中的所有视觉特效和动画
// ==========================================

import { GameCore } from './game-core.js';
import { UIManager } from './ui.js';

/**
 * 特效管理类
 */
export class VFXManager {
  /**
   * 创建粒子效果
   */
  static createParticle(r, c, type, colorName = null) {
    const particle = document.createElement("div");
    const top = (r + 0.5) * (100 / GameCore.GRID_SIZE) + "%";
    const left = (c + 0.5) * (100 / GameCore.GRID_SIZE) + "%";

    particle.style.top = top;
    particle.style.left = left;

    if (type === "debris") {
      particle.classList.add("debris");
      const angle = Math.random() * 360;
      const dist = 10 + Math.random() * 15;
      const tx = Math.cos((angle * Math.PI) / 180) * dist + "vmin";
      const ty = Math.sin((angle * Math.PI) / 180) * dist + "vmin";
      particle.style.setProperty("--tx", tx);
      particle.style.setProperty("--ty", ty);
    } else if (type === "ice-shard") {
      particle.classList.add("ice-shard");
      const angle = Math.random() * 360;
      const dist = 5 + Math.random() * 10;
      const tx = Math.cos((angle * Math.PI) / 180) * dist + "vmin";
      const ty = Math.sin((angle * Math.PI) / 180) * dist + "vmin";
      particle.style.setProperty("--tx", tx);
      particle.style.setProperty("--ty", ty);
    } else if (type === "bubble") {
      particle.classList.add("bubble");
      particle.style.left = (c + Math.random()) * (100 / GameCore.GRID_SIZE) + "%";
    } else if (type === "crush") {
      particle.classList.add("crush-particle");
      const crushColor = colorName || "white";
      particle.style.setProperty("--p-color", `var(--color-${crushColor})`);

      const angle = Math.random() * 360;
      const dist = 5 + Math.random() * 8;
      const tx = Math.cos((angle * Math.PI) / 180) * dist + "vmin";
      const ty = Math.sin((angle * Math.PI) / 180) * dist + "vmin";

      particle.style.setProperty("--tx", tx);
      particle.style.setProperty("--ty", ty);

      particle.style.width = 0.5 + Math.random() * 0.8 + "vmin";
      particle.style.height = particle.style.width;
      particle.style.transform = `rotate(${Math.random() * 360}deg)`;
    }

    UIManager.vfxContainer.appendChild(particle);
    setTimeout(() => particle.remove(), 1000);
  }

  /**
   * 显示视觉特效
   */
  static showVFX(r, c, type, orientation = "horizontal") {
    const el = document.createElement("div");
    const top = (r + 0.5) * (100 / GameCore.GRID_SIZE) + "%";
    const left = (c + 0.5) * (100 / GameCore.GRID_SIZE) + "%";

    el.style.top = top;
    el.style.left = left;

    if (type === "frost-nova") {
      el.classList.add("frost-nova");
      for (let i = 0; i < 8; i++) this.createParticle(r, c, "ice-shard");
    } else if (type === "acid-splash") {
      el.classList.add("acid-splash");
      for (let i = 0; i < 6; i++)
        this.createParticle(r, c, "crush", Math.random() > 0.5 ? "green" : "orange");
    } else if (type === "biohazard") {
      const bio = document.createElement("div");
      bio.classList.add("biohazard-symbol");
      bio.style.top = top;
      bio.style.left = left;
      UIManager.vfxContainer.appendChild(bio);
      setTimeout(() => bio.remove(), 1000);
    } else if (type === "shockwave") {
      el.classList.add("shockwave");
      for (let i = 0; i < 8; i++) this.createParticle(r, c, "debris");
    } else if (type === "wind-slash") {
      el.classList.add("wind-slash");
      const angle = orientation === "col" ? 90 : 0;
      el.style.setProperty("--angle", angle + "deg");
    } else if (type === "hydro-beam") {
      el.classList.add("hydro-beam");
      el.style.left = "0";
      el.style.top = "0";
      if (orientation === "row") {
        el.style.width = "100%";
        el.style.height = `calc(100% / ${GameCore.GRID_SIZE} - var(--gap-size))`;
        el.style.top = r * (100 / GameCore.GRID_SIZE) + "%";
      } else {
        el.classList.add("vertical");
        el.style.height = "100%";
        el.style.width = `calc(100% / ${GameCore.GRID_SIZE} - var(--gap-size))`;
        el.style.left = c * (100 / GameCore.GRID_SIZE) + "%";
      }
      for (let k = 0; k < GameCore.GRID_SIZE; k++) {
        if (Math.random() > 0.5)
          this.createParticle(
            orientation === "row" ? r : k,
            orientation === "row" ? k : c,
            "bubble"
          );
      }
    } else if (type === "void-vortex") {
      el.classList.add("void-vortex");
      const cell = GameCore.getCellElement(r, c);
      if (cell) {
        el.style.width = cell.offsetWidth + "px";
        el.style.height = cell.offsetHeight + "px";
        el.style.top = cell.offsetTop + "px";
        el.style.left = cell.offsetLeft + "px";
      }
      UIManager.vfxContainer.appendChild(el);
      setTimeout(() => el.remove(), 1200);
    } else if (type === "lightning") {
      el.classList.add("lightning-arc");
      if (
        orientation &&
        typeof orientation === "object" &&
        orientation.r !== undefined
      ) {
        const targetR = orientation.r;
        const targetC = orientation.c;
        const startTop = (r + 0.5) * (100 / GameCore.GRID_SIZE) + "%";
        const startLeft = (c + 0.5) * (100 / GameCore.GRID_SIZE) + "%";
        const endTop = (targetR + 0.5) * (100 / GameCore.GRID_SIZE) + "%";
        const endLeft = (targetC + 0.5) * (100 / GameCore.GRID_SIZE) + "%";

        const dx = (targetC - c) * (100 / GameCore.GRID_SIZE);
        const dy = (targetR - r) * (100 / GameCore.GRID_SIZE);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        const distance = Math.sqrt(dx * dx + dy * dy) * GameCore.GRID_SIZE;

        el.style.top = startTop;
        el.style.left = startLeft;
        el.style.width = distance + "vmin";
        el.style.transformOrigin = "0 50%";
        el.style.transform = `rotate(${angle}deg)`;
        el.style.setProperty("--lightning-length", distance + "vmin");
      }
    } else if (type === "holy-beam") {
      el.classList.add("holy-beam");
      el.style.left = "0";
      el.style.top = "0";
      if (orientation === "row") {
        el.style.width = "100%";
        el.style.height = `calc(100% / ${GameCore.GRID_SIZE} - var(--gap-size))`;
        el.style.top = r * (100 / GameCore.GRID_SIZE) + "%";
      } else {
        el.classList.add("vertical");
        el.style.height = "100%";
        el.style.width = `calc(100% / ${GameCore.GRID_SIZE} - var(--gap-size))`;
        el.style.left = c * (100 / GameCore.GRID_SIZE) + "%";
      }
    }

    // 添加到VFX容器
    UIManager.vfxContainer.appendChild(el);

    // 设置自动移除（除了void-vortex已经处理过）
    if (type !== "void-vortex") {
      setTimeout(() => el.remove(), 1200);
    }
  }

  /**
   * 显示闪光效果
   */
  static showFlash(r, c, color = "white", duration = 300) {
    const flash = document.createElement("div");
    flash.classList.add("flash-effect");
    flash.style.top = r * (100 / GameCore.GRID_SIZE) + "%";
    flash.style.left = c * (100 / GameCore.GRID_SIZE) + "%";
    flash.style.setProperty("--flash-color", `var(--color-${color})`);

    UIManager.vfxContainer.appendChild(flash);
    setTimeout(() => flash.remove(), duration);
  }

  /**
   * 显示爆炸效果
   */
  static showExplosion(r, c, color = "orange") {
    const explosion = document.createElement("div");
    explosion.classList.add("explosion-effect");
    explosion.style.top = (r + 0.5) * (100 / GameCore.GRID_SIZE) + "%";
    explosion.style.left = (c + 0.5) * (100 / GameCore.GRID_SIZE) + "%";
    explosion.style.setProperty("--explosion-color", `var(--color-${color})`);

    // 创建爆炸粒子
    for (let i = 0; i < 12; i++) {
      this.createParticle(r, c, "debris");
    }

    UIManager.vfxContainer.appendChild(explosion);
    setTimeout(() => explosion.remove(), 800);
  }

  /**
   * 显示组合连击效果
   */
  static showCombo(combo, r, c) {
    if (combo <= 1) return;

    const comboText = document.createElement("div");
    comboText.classList.add("combo-text");
    comboText.textContent = `${combo}x`;
    comboText.style.top = (r + 0.5) * (100 / GameCore.GRID_SIZE) + "%";
    comboText.style.left = (c + 0.5) * (100 / GameCore.GRID_SIZE) + "%";

    UIManager.vfxContainer.appendChild(comboText);
    setTimeout(() => comboText.remove(), 1500);
  }
}
