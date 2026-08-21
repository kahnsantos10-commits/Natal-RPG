import { DiceRollResult, RPGSystem } from "../types";
import { rpgAudio } from "./audioSynth";

export function rollSingleDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

// Ordem Paranormal Dice Pool: Roll (Attribute) d20s and keep the highest.
// If attribute is 0, roll 2d20 and keep the lowest.
export function rollOrdemAttribute(
  attributeValue: number,
  bonus: number = 0,
  skillName: string = "Teste de Atributo",
  rollerName: string = "Agente",
  critRange: number = 20
): DiceRollResult {
  rpgAudio.playDiceRoll();

  let rolls: number[] = [];
  let chosenDie: number;
  let formulaStr: string;

  if (attributeValue <= 0) {
    rolls = [rollSingleDie(20), rollSingleDie(20)];
    chosenDie = Math.min(...rolls);
    formulaStr = `2d20 (Desvantagem Atrib 0) + ${bonus}`;
  } else {
    for (let i = 0; i < attributeValue; i++) {
      rolls.push(rollSingleDie(20));
    }
    chosenDie = Math.max(...rolls);
    formulaStr = `${attributeValue}d20 + ${bonus}`;
  }

  const isCrit = chosenDie >= critRange;
  const isFumble = chosenDie === 1 && (attributeValue <= 0 || rolls.every(r => r === 1));

  if (isCrit) {
    setTimeout(() => rpgAudio.playCritSound(), 200);
  } else if (isFumble) {
    setTimeout(() => rpgAudio.playFumbleSound(), 200);
  }

  return {
    id: `roll-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    formula: formulaStr,
    diceType: "d20",
    rolls,
    modifier: bonus,
    total: chosenDie + bonus,
    isCrit,
    isFumble,
    timestamp: Date.now(),
    rollerName,
    reason: skillName,
    system: "ordem"
  };
}

// D&D 5e Standard Roll
export function rollDnDCheck(
  bonus: number = 0,
  advantage: "none" | "adv" | "dis" = "none",
  reason: string = "Teste de D&D",
  rollerName: string = "Aventureiro"
): DiceRollResult {
  rpgAudio.playDiceRoll();

  let rolls: number[] = [];
  let chosenDie: number;
  let formulaStr: string;

  if (advantage === "adv") {
    rolls = [rollSingleDie(20), rollSingleDie(20)];
    chosenDie = Math.max(...rolls);
    formulaStr = `2d20 (Vantagem) + ${bonus}`;
  } else if (advantage === "dis") {
    rolls = [rollSingleDie(20), rollSingleDie(20)];
    chosenDie = Math.min(...rolls);
    formulaStr = `2d20 (Desvantagem) + ${bonus}`;
  } else {
    rolls = [rollSingleDie(20)];
    chosenDie = rolls[0];
    formulaStr = `1d20 + ${bonus}`;
  }

  const isCrit = chosenDie === 20;
  const isFumble = chosenDie === 1;

  if (isCrit) {
    setTimeout(() => rpgAudio.playCritSound(), 200);
  } else if (isFumble) {
    setTimeout(() => rpgAudio.playFumbleSound(), 200);
  }

  return {
    id: `roll-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    formula: formulaStr,
    diceType: "d20",
    rolls,
    modifier: bonus,
    total: chosenDie + bonus,
    isCrit,
    isFumble,
    timestamp: Date.now(),
    rollerName,
    reason,
    system: "dnd5e"
  };
}

// Generic Freeform Dice Parser: "2d6+4", "1d8+1d4", "3d10-2", "1d100"
export function parseAndRollFormula(
  formula: string,
  reason: string = "Rolagem Livre",
  rollerName: string = "Jogador",
  system: RPGSystem = "dnd5e"
): DiceRollResult {
  rpgAudio.playDiceRoll();

  const cleaned = formula.replace(/\s+/g, "").toLowerCase();
  const dicePattern = /([+-]?\d*d\d+|[+-]?\d+)/g;
  const matches = cleaned.match(dicePattern) || [formula];

  let rolls: number[] = [];
  let modifier = 0;
  let total = 0;
  let primaryDieType = "d20";

  for (const match of matches) {
    if (match.includes("d")) {
      const isNegative = match.startsWith("-");
      const cleanMatch = match.replace(/^[+-]/, "");
      const [countStr, sidesStr] = cleanMatch.split("d");
      const count = parseInt(countStr || "1", 10);
      const sides = parseInt(sidesStr || "20", 10);
      primaryDieType = `d${sides}`;

      for (let i = 0; i < count; i++) {
        const val = rollSingleDie(sides);
        rolls.push(val);
        total += isNegative ? -val : val;
      }
    } else {
      const modVal = parseInt(match, 10);
      if (!isNaN(modVal)) {
        modifier += modVal;
        total += modVal;
      }
    }
  }

  const isCrit = primaryDieType === "d20" && rolls.includes(20);
  const isFumble = primaryDieType === "d20" && rolls.includes(1) && rolls.length === 1;

  if (isCrit) {
    setTimeout(() => rpgAudio.playCritSound(), 200);
  } else if (isFumble) {
    setTimeout(() => rpgAudio.playFumbleSound(), 200);
  }

  return {
    id: `roll-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    formula,
    diceType: primaryDieType,
    rolls,
    modifier,
    total,
    isCrit,
    isFumble,
    timestamp: Date.now(),
    rollerName,
    reason,
    system
  };
}
