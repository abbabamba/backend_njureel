'use strict';

// Fonction constructeur pour les graphiques
function Graph(canvas) {
  this.canvas = canvas;
  this.ctx = canvas.getContext('2d');
  this.points = [];
  this.maxPoints = 50; // Nombre de points à afficher
  this.valueMultiplier = 1; // Multiplicateur pour ajuster l'échelle si nécessaire
  this.colors = {
    background: '#f0f0f0',
    line: '#4CAF50', // Vert
    text: '#333'
  };

  this.width = canvas.width;
  this.height = canvas.height;

  // Configuration du contexte de dessin
  this.ctx.font = '10px sans-serif';
  this.ctx.textAlign = 'center';
  this.ctx.textBaseline = 'middle';

  this.draw(); // Dessiner le graphique initial
}

// Ajoute un point au graphique
Graph.prototype.addPoint = function(point) {
  this.points.push(point * this.valueMultiplier);
  if (this.points.length > this.maxPoints) {
    this.points.shift(); // Supprimer le plus ancien point si on dépasse maxPoints
  }
  this.draw();
};

// Efface et redessine le graphique
Graph.prototype.draw = function() {
  const ctx = this.ctx;
  const width = this.width;
  const height = this.height;

  ctx.clearRect(0, 0, width, height); // Effacer tout le canvas
  ctx.fillStyle = this.colors.background;
  ctx.fillRect(0, 0, width, height);

  if (this.points.length === 0) {
    return; // Rien à dessiner
  }

  // Trouver la valeur max pour l'échelle (peut-être fixe pour le niveau audio 0-1)
  const maxValue = 1.0; // Pour le niveau audio (0-1)

  ctx.strokeStyle = this.colors.line;
  ctx.lineWidth = 2;

  ctx.beginPath();
  // Dessiner la ligne du graphique
  for (let i = 0; i < this.points.length; i++) {
    const x = (i / (this.maxPoints - 1)) * width;
    const y = height - (this.points[i] / maxValue) * height; // Inverser l'axe Y
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();

  // Dessiner la valeur actuelle du point le plus récent
  ctx.fillStyle = this.colors.text;
  const lastPoint = this.points[this.points.length - 1];
  const lastPointText = lastPoint.toFixed(2); // Afficher avec 2 décimales
  ctx.fillText(lastPointText, width - 20, height / 2); // Position du texte

  // Vous pouvez ajouter des lignes de grille, des légendes, etc.
};