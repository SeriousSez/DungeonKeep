import { CommonModule, DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { equipmentCatalog } from '../../data/new-character-standard-page.data';
import type { EquipmentItem } from '../../data/new-character-standard-page.types';
import { getRulesEntryBySlug, type RulesLink, type RulesSectionEntry } from '../../data/rules-links';

const MAGIC_ITEM_CATEGORIES = new Set(['Wondrous Item', 'Ring', 'Rod', 'Staff', 'Wand', 'Potion', 'Scroll']);

type GlossaryCategory = 'Core' | 'Actions' | 'Combat' | 'Conditions' | 'Movement' | 'Magic' | 'Exploration';

interface GlossaryTerm {
  term: string;
  category: GlossaryCategory;
  tag?: string;
  summary: string;
  details: readonly string[];
  seeAlso?: readonly string[];
}

interface GlossaryTextSegment {
  text: string;
  target?: string;
}

const GLOSSARY_CONVENTIONS: ReadonlyArray<{ title: string; text: string }> = [
  { title: 'Bracket tags', text: 'Some entries belong to a rules family, such as actions, conditions, hazards, or areas of effect.' },
  { title: 'Table-side language', text: 'When a rule says you, it means the creature or object the rule is affecting in that moment.' },
  { title: 'See also links', text: 'Related terms matter. Movement, cover, reactions, and conditions often interact with each other.' },
  { title: 'Current wording only', text: 'Use the glossary to settle active play questions with modern wording instead of older table memory.' }
];

const GLOSSARY_ABBREVIATIONS: ReadonlyArray<{ short: string; meaning: string }> = [
  { short: 'AC', meaning: 'Armor Class' },
  { short: 'C', meaning: 'Concentration' },
  { short: 'CR', meaning: 'Challenge Rating' },
  { short: 'DC', meaning: 'Difficulty Class' },
  { short: 'DM', meaning: 'Dungeon Master' },
  { short: 'HP', meaning: 'Hit Points' },
  { short: 'NPC', meaning: 'Nonplayer Character' },
  { short: 'PB', meaning: 'Proficiency Bonus' },
  { short: 'XP', meaning: 'Experience Points' },
  { short: 'Str.', meaning: 'Strength' },
  { short: 'Dex.', meaning: 'Dexterity' },
  { short: 'Con.', meaning: 'Constitution' },
  { short: 'Int.', meaning: 'Intelligence' },
  { short: 'Wis.', meaning: 'Wisdom' },
  { short: 'Cha.', meaning: 'Charisma' },
  { short: 'CP / SP / EP / GP / PP', meaning: 'Copper, Silver, Electrum, Gold, and Platinum Pieces' },
  { short: 'V / S / M', meaning: 'Verbal, Somatic, and Material spell components' },
  { short: 'R', meaning: 'Ritual' }
];

const GLOSSARY_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeGlossaryAlias(value: string): string {
  return value
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.,;:!?]+$/g, '')
    .toLowerCase();
}

function buildGlossaryReferenceMap(terms: ReadonlyArray<GlossaryTerm>): Map<string, string> {
  const aliases = new Map<string, string>();

  const addAlias = (alias: string, canonical: string) => {
    const normalizedAlias = normalizeGlossaryAlias(alias);
    if (!normalizedAlias) {
      return;
    }

    aliases.set(normalizedAlias, canonical);
  };

  for (const term of terms) {
    const canonical = term.term;
    const baseName = canonical.replace(/\s*\[[^\]]+\]$/, '').trim();

    addAlias(canonical, canonical);
    addAlias(baseName, canonical);
    addAlias(`${baseName}s`, canonical);
  }

  addAlias('ability checks', 'Ability Check');
  addAlias('attack', 'Attack [Action]');
  addAlias('attacking', 'Attack [Action]');
  addAlias('attack rolls', 'Attack Roll');
  addAlias('bonus actions', 'Bonus Action');
  addAlias('conditions', 'Condition');
  addAlias('damage types', 'Damage Types');
  addAlias('dash', 'Dash [Action]');
  addAlias('dashing', 'Dash [Action]');
  addAlias('dodge', 'Dodge [Action]');
  addAlias('dodging', 'Dodge [Action]');
  addAlias('heavily obscured', 'Heavily Obscured');
  addAlias('helping', 'Help [Action]');
  addAlias('hiding', 'Hide');
  addAlias('hit points', 'Hit Points');
  addAlias('influencing', 'Influence [Action]');
  addAlias('lightly obscured', 'Lightly Obscured');
  addAlias('long rest', 'Long Rest');
  addAlias('opportunity attacks', 'Opportunity Attack');
  addAlias('reactions', 'Reaction');
  addAlias('saving throws', 'Saving Throw');
  addAlias('searching', 'Search');
  addAlias('short rest', 'Short Rest');
  addAlias('spell cast', 'Spell');
  addAlias('spell casts', 'Spell');
  addAlias('spells', 'Spell');
  addAlias('studying', 'Study [Action]');
  addAlias('temporary hit points', 'Temporary Hit Points');

  return aliases;
}

const RULES_GLOSSARY_TERMS: ReadonlyArray<GlossaryTerm> = [
  {
    term: 'Ability Check',
    category: 'Core',
    summary: 'Use this roll when a character tries to overcome a challenge with a skill, tool, or raw ability score.',
    details: ['Roll a d20 and add the matching ability modifier.', 'Add proficiency only when the character is trained in the relevant skill or tool.'],
    seeAlso: ['D20 Test', 'Proficiency']
  },
  {
    term: 'Action',
    category: 'Actions',
    tag: 'Action',
    summary: 'Your action is the main thing you do on your turn.',
    details: ['Attacking, dashing, helping, searching, and many spell casts use it.', 'You normally get one action on your turn unless a feature changes that.'],
    seeAlso: ['Bonus Action', 'Reaction']
  },
  {
    term: 'Advantage',
    category: 'Core',
    summary: 'Roll two d20s and keep the higher result when the situation strongly favors you.',
    details: ['Multiple sources of advantage do not stack.', 'Advantage and disadvantage cancel each other out on the same roll.'],
    seeAlso: ['Disadvantage', 'D20 Test']
  },
  {
    term: 'Attack Roll',
    category: 'Combat',
    summary: 'This d20 test determines whether a weapon, unarmed strike, or spell attack hits a target.',
    details: ['Compare the final roll to the target’s Armor Class.', 'A natural 20 always hits and becomes a critical hit.'],
    seeAlso: ['Armor Class', 'Critical Hit']
  },
  {
    term: 'Attunement',
    category: 'Magic',
    summary: 'Some magic items require a bond before their strongest properties function.',
    details: ['A creature can normally stay attuned to no more than three magic items at once.', 'If an item says it requires attunement, treat that as part of the item’s cost.'],
    seeAlso: ['Magic Item', 'Long Rest']
  },
  {
    term: 'Bonus Action',
    category: 'Actions',
    tag: 'Action',
    summary: 'A bonus action is a smaller piece of turn economy that only exists when a rule grants it.',
    details: ['You can take at most one bonus action on a turn.', 'If no feature or spell gives you one, you do not have one to spend.'],
    seeAlso: ['Action', 'Reaction']
  },
  {
    term: 'Condition',
    category: 'Conditions',
    tag: 'Condition',
    summary: 'A condition is a temporary rules state such as blinded, prone, restrained, or stunned.',
    details: ['Conditions change what a creature can do, how it moves, or how easily it can be hit.', 'Most conditions do not stack with themselves.'],
    seeAlso: ['Blinded', 'Prone', 'Restrained']
  },
  {
    term: 'Concentration',
    category: 'Magic',
    summary: 'Many ongoing spells end early if the caster loses focus.',
    details: ['Taking damage often forces a Constitution save to keep the effect active.', 'Starting another concentration effect immediately ends the first one.'],
    seeAlso: ['Spell', 'Saving Throw']
  },
  {
    term: 'Cover',
    category: 'Combat',
    summary: 'Cover protects a target that is partly or fully blocked by terrain or obstacles.',
    details: ['Half and three-quarters cover raise AC and Dexterity saves.', 'Total cover prevents direct targeting in most cases.'],
    seeAlso: ['Armor Class', 'Area of Effect']
  },
  {
    term: 'Critical Hit',
    category: 'Combat',
    summary: 'A critical hit usually happens on a natural 20 and increases the damage dice rolled.',
    details: ['Roll the attack’s damage dice twice, then add modifiers as normal.', 'A critical hit always lands even if modifiers would have missed.'],
    seeAlso: ['Attack Roll', 'Damage']
  },
  {
    term: 'D20 Test',
    category: 'Core',
    summary: 'This umbrella term covers ability checks, attack rolls, and saving throws.',
    details: ['If a rule affects d20 tests, it affects all three types of rolls.', 'Advantage and disadvantage usually apply here.'],
    seeAlso: ['Ability Check', 'Attack Roll', 'Saving Throw']
  },
  {
    term: 'Difficult Terrain',
    category: 'Movement',
    summary: 'Movement through a difficult space costs extra feet.',
    details: ['Each foot moved usually costs one extra foot of speed.', 'It commonly comes from rubble, deep snow, water, heavy growth, or crowded spaces.'],
    seeAlso: ['Speed', 'Climbing']
  },
  {
    term: 'Disengage',
    category: 'Actions',
    tag: 'Action',
    summary: 'This action lets you move without provoking opportunity attacks for the rest of the turn.',
    details: ['It is the safe exit button when leaving a threatened space.', 'It does not help if another rule already stops your movement.'],
    seeAlso: ['Opportunity Attack', 'Movement']
  },
  {
    term: 'Exhaustion',
    category: 'Conditions',
    tag: 'Condition',
    summary: 'Exhaustion is a stacking penalty that drags down d20 tests and movement.',
    details: ['Each level makes checks worse and reduces speed further.', 'At six levels, the creature dies.'],
    seeAlso: ['Long Rest', 'Hazard']
  },
  {
    term: 'Grappled',
    category: 'Conditions',
    tag: 'Condition',
    summary: 'A grapple locks a target in place and makes escaping or repositioning a real problem.',
    details: ['A grappled creature’s speed becomes 0.', 'The grappler can often drag the target while moving.'],
    seeAlso: ['Unarmed Strike', 'Speed']
  },
  {
    term: 'Hide',
    category: 'Exploration',
    tag: 'Action',
    summary: 'Hiding is how a creature tries to become unseen or hard to locate.',
    details: ['You usually need heavy obscurement or meaningful cover to attempt it.', 'Making noise, attacking, or being found ends hidden status quickly.'],
    seeAlso: ['Invisible', 'Cover', 'Stealth']
  },
  {
    term: 'Invisible',
    category: 'Conditions',
    tag: 'Condition',
    summary: 'Invisible creatures cannot be seen normally and gain major combat benefits.',
    details: ['Attack rolls against them are harder, and their own attacks are often improved.', 'Effects that require sight usually fail unless the observer has a way to see them.'],
    seeAlso: ['Hide', 'Blindsight', 'Truesight']
  },
  {
    term: 'Opportunity Attack',
    category: 'Combat',
    summary: 'Leaving a creature’s reach can trigger a reaction attack.',
    details: ['It usually happens right before the moving creature gets out of reach.', 'Disengage and some forms of forced movement can avoid it.'],
    seeAlso: ['Reaction', 'Disengage']
  },
  {
    term: 'Prone',
    category: 'Conditions',
    tag: 'Condition',
    summary: 'A prone creature is on the ground and fights or moves less effectively.',
    details: ['Standing up costs movement.', 'Nearby attackers gain an easier time hitting, while distant attackers are often worse off.'],
    seeAlso: ['Movement', 'Grappled']
  },
  {
    term: 'Reaction',
    category: 'Actions',
    tag: 'Action',
    summary: 'A reaction is a response to a trigger that can happen on your turn or someone else’s.',
    details: ['You get one reaction per round until the start of your next turn.', 'Opportunity attacks and readied actions both spend it.'],
    seeAlso: ['Action', 'Ready']
  },
  {
    term: 'Resistance',
    category: 'Combat',
    summary: 'Resistance halves incoming damage of a particular type.',
    details: ['Apply it once to that damage instance after the type is known.', 'It is one of the most important durability keywords in the game.'],
    seeAlso: ['Vulnerability', 'Damage Types']
  },
  {
    term: 'Saving Throw',
    category: 'Core',
    summary: 'A saving throw is how a creature avoids or shrugs off a threat.',
    details: ['The effect causing the save tells you which ability to use and what success changes.', 'A creature can choose to fail a save unless a rule says otherwise.'],
    seeAlso: ['D20 Test', 'Difficulty Class']
  },
  {
    term: 'Search',
    category: 'Exploration',
    tag: 'Action',
    summary: 'Use Search when the goal is to notice something hidden, subtle, or easy to miss.',
    details: ['Perception is common here, but the DM can call for another skill when appropriate.', 'It is different from Study, which is about interpreting or recalling information.'],
    seeAlso: ['Study', 'Perception']
  },
  {
    term: 'Speed',
    category: 'Movement',
    summary: 'Speed is the number of feet a creature can move on its turn.',
    details: ['Special speeds like climb, swim, burrow, or fly can replace normal walking movement.', 'Effects that reduce or raise speed often change every movement mode you have.'],
    seeAlso: ['Difficult Terrain', 'Fly Speed', 'Swim Speed']
  },
  {
    term: 'Spell',
    category: 'Magic',
    summary: 'A spell is a magical effect with a defined casting time, range, components, and duration.',
    details: ['Some spells use slots, while cantrips do not.', 'Concentration, components, and targets are often the first things to check.'],
    seeAlso: ['Concentration', 'Spell Attack', 'Ritual']
  },
  {
    term: 'Temporary Hit Points',
    category: 'Combat',
    summary: 'Temporary hit points act as a buffer that is lost before real hit points.',
    details: ['They do not stack with other temporary hit points; you keep the better pool.', 'They are excellent for surviving attrition but do not count as healing.'],
    seeAlso: ['Hit Points', 'Healing']
  },
  {
    term: 'Unarmed Strike',
    category: 'Combat',
    summary: 'This is a melee attack made with the body instead of a weapon.',
    details: ['It can deal damage, initiate a grapple, or shove a target depending on the option chosen.', 'It is one of the most important default combat actions in close quarters.'],
    seeAlso: ['Attack Roll', 'Grappled', 'Prone']
  },
  {
    term: 'Utilize',
    category: 'Actions',
    tag: 'Action',
    summary: 'Use Utilize when an object or item explicitly needs an action to activate.',
    details: ['This covers many potions, tools, levers, and environmental interactions.', 'If the interaction is simple and quick, the DM may allow it as part of another activity instead.'],
    seeAlso: ['Action', 'Equipment']
  },
  {
    term: 'Ability Score and Modifier',
    category: 'Core',
    summary: 'Each creature has six abilities, and their modifiers are what usually matter at the table.',
    details: ['Checks, saves, attacks, initiative, and many class features use these modifiers.', 'When a rule asks for Strength, Dexterity, or another ability, start with the matching modifier.'],
    seeAlso: ['Ability Check', 'Saving Throw']
  },
  {
    term: 'Armor Class',
    category: 'Combat',
    summary: 'Armor Class is the number an attack roll must meet or beat to land a hit.',
    details: ['Armor, shields, Dexterity, cover, and magical effects can all change it.', 'Different AC formulas do not stack; use the one that applies.'],
    seeAlso: ['Attack Roll', 'Cover']
  },
  {
    term: 'Attack [Action]',
    category: 'Actions',
    summary: 'Taking the Attack action lets you make a weapon attack or an unarmed strike.',
    details: ['If you have features like Extra Attack, you can make more than one strike as part of this action.', 'You can also draw or stow one weapon around the attack as part of the flow.'],
    seeAlso: ['Attack Roll', 'Unarmed Strike', 'Weapon Attack']
  },
  {
    term: 'Attitude',
    category: 'Exploration',
    summary: 'A creature can start social interaction as friendly, hostile, or indifferent toward you.',
    details: ['That attitude shapes whether social influence is easy, hard, or nearly impossible.', 'It is most useful when roleplay and persuasion checks matter.'],
    seeAlso: ['Friendly [Attitude]', 'Hostile [Attitude]', 'Indifferent [Attitude]']
  },
  {
    term: 'Blinded [Condition]',
    category: 'Conditions',
    summary: 'A blinded creature cannot see and fights at a severe disadvantage.',
    details: ['Sight-based ability checks fail automatically.', 'Attacks against the creature improve, and its own attacks are less accurate.'],
    seeAlso: ['Condition', 'Invisible', 'Darkness']
  },
  {
    term: 'Bright Light',
    category: 'Exploration',
    summary: 'Bright light is normal clear illumination with no special penalties attached.',
    details: ['It is the baseline visibility state for most combat and travel scenes.', 'Dim light and darkness are the levels that start adding complications.'],
    seeAlso: ['Dim Light', 'Darkness']
  },
  {
    term: 'Charmed [Condition]',
    category: 'Conditions',
    summary: 'A charmed creature cannot freely turn its aggression against the source of the charm.',
    details: ['The charmer also tends to gain an advantage in social interaction.', 'The exact source of the charm may add more limits or roleplay pressure.'],
    seeAlso: ['Condition', 'Attitude']
  },
  {
    term: 'Climbing',
    category: 'Movement',
    summary: 'Climbing usually costs extra movement unless a creature has a climb speed.',
    details: ['Slippery or difficult surfaces may call for Athletics checks.', 'Difficult terrain makes vertical movement even more expensive.'],
    seeAlso: ['Climb Speed', 'Difficult Terrain', 'Speed']
  },
  {
    term: 'Climb Speed',
    category: 'Movement',
    summary: 'A climb speed lets a creature scale surfaces without paying the normal extra cost.',
    details: ['It is one of the special movement modes alongside swim, burrow, and fly.', 'Effects that alter Speed usually alter this as well.'],
    seeAlso: ['Climbing', 'Speed']
  },
  {
    term: 'Crawling',
    category: 'Movement',
    summary: 'Crawling is slower movement used most often while prone or squeezing through bad terrain.',
    details: ['Each foot of crawling typically costs extra movement.', 'The penalty gets worse in difficult terrain.'],
    seeAlso: ['Prone', 'Difficult Terrain']
  },
  {
    term: 'Damage Types',
    category: 'Combat',
    summary: 'Damage comes in named types such as fire, cold, radiant, poison, and slashing.',
    details: ['Resistance, vulnerability, and immunity depend on these labels.', 'Always identify the damage type before applying defenses.'],
    seeAlso: ['Resistance', 'Vulnerability', 'Immunity']
  },
  {
    term: 'Darkness',
    category: 'Exploration',
    summary: 'Darkness creates heavily obscured areas that make ordinary sight ineffective.',
    details: ['Creatures relying only on normal vision struggle to perceive targets within it.', 'Darkvision and other senses can change how much of a problem it is.'],
    seeAlso: ['Blinded [Condition]', 'Darkvision']
  },
  {
    term: 'Dash [Action]',
    category: 'Actions',
    summary: 'Dash trades your action for extra movement on the current turn.',
    details: ['The extra distance usually equals your Speed.', 'You can choose whichever speed mode you are using when you take it.'],
    seeAlso: ['Speed', 'Action']
  },
  {
    term: 'Deafened [Condition]',
    category: 'Conditions',
    summary: 'A deafened creature cannot hear and automatically fails hearing-based checks.',
    details: ['This matters for stealth, awareness, and some social cues.', 'Certain spell or feature triggers that rely on hearing may also fail.'],
    seeAlso: ['Condition', 'Perception']
  },
  {
    term: 'Difficulty Class',
    category: 'Core',
    summary: 'A DC is the target number a check or saving throw must meet or beat.',
    details: ['Harder tasks or effects use higher DCs.', 'The rule creating the challenge usually tells you which ability applies.'],
    seeAlso: ['Ability Check', 'Saving Throw']
  },
  {
    term: 'Disadvantage',
    category: 'Core',
    summary: 'Roll two d20s and keep the lower result when the situation works against you.',
    details: ['Multiple sources do not stack beyond a single instance.', 'It cancels out advantage on the same roll.'],
    seeAlso: ['Advantage', 'D20 Test']
  },
  {
    term: 'Dodge [Action]',
    category: 'Actions',
    summary: 'Dodging makes you harder to hit and better at avoiding Dexterity-based danger until your next turn.',
    details: ['It is a strong defensive turn when survival matters more than offense.', 'If you become unable to act or move properly, the benefit can drop away.'],
    seeAlso: ['Action', 'Saving Throw']
  },
  {
    term: 'Friendly [Attitude]',
    category: 'Exploration',
    summary: 'A friendly creature is already inclined to help or at least hear you out.',
    details: ['This makes social influence attempts easier.', 'Friendly does not always mean reckless or self-sacrificing.'],
    seeAlso: ['Attitude', 'Influence [Action]']
  },
  {
    term: 'Help [Action]',
    category: 'Actions',
    summary: 'Help lets you set up an ally for a better check or attack.',
    details: ['You can assist with a skill or tool task when your aid makes sense.', 'You can also distract a nearby enemy to improve an ally’s next attack.'],
    seeAlso: ['Action', 'Advantage']
  },
  {
    term: 'Hostile [Attitude]',
    category: 'Exploration',
    summary: 'A hostile creature starts from suspicion, opposition, or open aggression.',
    details: ['Social checks against it are much harder to land cleanly.', 'Good roleplay or leverage may still matter, but the tone is uphill.'],
    seeAlso: ['Attitude', 'Influence [Action]']
  },
  {
    term: 'Incapacitated [Condition]',
    category: 'Conditions',
    summary: 'An incapacitated creature cannot take actions, bonus actions, or reactions.',
    details: ['Concentration breaks immediately.', 'Many worse conditions include this as part of their effect.'],
    seeAlso: ['Condition', 'Stunned [Condition]', 'Unconscious [Condition]']
  },
  {
    term: 'Indifferent [Attitude]',
    category: 'Exploration',
    summary: 'Indifferent is the neutral starting point for many creatures during social scenes.',
    details: ['They are not eager to help, but they are not committed enemies either.', 'Careful tone and leverage can move them in either direction.'],
    seeAlso: ['Attitude', 'Influence [Action]']
  },
  {
    term: 'Influence [Action]',
    category: 'Actions',
    summary: 'Influence is the formal action for pushing a creature socially through persuasion, deception, threat, or charm.',
    details: ['The creature’s attitude changes how difficult the attempt is.', 'Sometimes no roll is needed if the request already fits the creature’s motives.'],
    seeAlso: ['Attitude', 'Friendly [Attitude]', 'Hostile [Attitude]']
  },
  {
    term: 'Initiative',
    category: 'Combat',
    summary: 'Initiative decides the order of turns once a fight breaks out.',
    details: ['Dexterity is the usual basis for the roll.', 'Surprise, invisibility, and other effects can make the roll better or worse.'],
    seeAlso: ['Reaction', 'Surprise']
  },
  {
    term: 'Long Rest',
    category: 'Core',
    summary: 'A long rest is the major reset period that restores most daily resources.',
    details: ['It usually takes a full night of downtime with limited interruption.', 'It restores hit points and helps reduce exhaustion.'],
    seeAlso: ['Short Rest', 'Exhaustion']
  },
  {
    term: 'Magic [Action]',
    category: 'Actions',
    summary: 'The Magic action is used for casting many spells or activating magical effects that require an action.',
    details: ['Longer casting times still demand repeated focus and concentration.', 'Many magic items and class features specifically call for this action.'],
    seeAlso: ['Spell', 'Concentration']
  },
  {
    term: 'Passive Perception',
    category: 'Exploration',
    summary: 'Passive Perception measures what a creature notices without actively searching.',
    details: ['It is often used to spot ambushes, traps, or hidden details in the background.', 'Advantage or disadvantage can shift the score up or down.'],
    seeAlso: ['Search', 'Hide', 'Perception']
  },
  {
    term: 'Ready [Action]',
    category: 'Actions',
    summary: 'Ready lets you prepare a response and spend your reaction when the trigger happens.',
    details: ['You choose the trigger first and then define the response.', 'If you ready a spell, you must hold it with concentration until release.'],
    seeAlso: ['Reaction', 'Concentration']
  },
  {
    term: 'Restrained [Condition]',
    category: 'Conditions',
    summary: 'A restrained creature is locked down, easier to hit, and worse at attacking or dodging.',
    details: ['Its speed becomes 0.', 'Dexterity saves and attack rolls both suffer while enemies gain an edge.'],
    seeAlso: ['Grappled', 'Prone', 'Condition']
  },
  {
    term: 'Ritual',
    category: 'Magic',
    summary: 'Some prepared spells can be cast as rituals to avoid spending a spell slot.',
    details: ['The tradeoff is extra casting time.', 'Only spells with the ritual tag can use this option.'],
    seeAlso: ['Spell', 'Magic [Action]']
  },
  {
    term: 'Short Rest',
    category: 'Core',
    summary: 'A short rest is a one-hour pause for recovery and class features that recharge quickly.',
    details: ['Characters can spend Hit Dice to recover hit points.', 'Taking damage, rolling initiative, or other pressure can interrupt it.'],
    seeAlso: ['Long Rest', 'Hit Points']
  },
  {
    term: 'Spell Attack',
    category: 'Magic',
    summary: 'A spell attack is an attack roll delivered by magic instead of a weapon.',
    details: ['It still uses the normal logic of hit or miss against Armor Class.', 'Different classes and monsters calculate the bonus in different ways.'],
    seeAlso: ['Attack Roll', 'Spell']
  },
  {
    term: 'Study [Action]',
    category: 'Actions',
    summary: 'Study is the action for recalling lore, interpreting clues, or understanding knowledge in front of you.',
    details: ['It commonly uses Arcana, History, Investigation, Nature, or Religion.', 'Use it when the goal is understanding, not spotting.'],
    seeAlso: ['Search', 'Ability Check']
  },
  {
    term: 'Stunned [Condition]',
    category: 'Conditions',
    summary: 'A stunned creature is effectively shut down and left open to follow-up attacks.',
    details: ['It is incapacitated and fails key physical saves automatically.', 'Attacks against it are easier to land.'],
    seeAlso: ['Incapacitated [Condition]', 'Paralyzed [Condition]']
  },
  {
    term: 'Swim Speed',
    category: 'Movement',
    summary: 'A swim speed removes the normal extra movement cost of swimming.',
    details: ['It is especially valuable in rough water or underwater encounters.', 'Changes to Speed usually affect this movement mode too.'],
    seeAlso: ['Swimming', 'Speed']
  },
  {
    term: 'Unconscious [Condition]',
    category: 'Conditions',
    summary: 'An unconscious creature is unaware, prone, and unable to act or defend itself well.',
    details: ['It drops what it is holding and automatically fails key physical saves.', 'Close-range hits against it become especially dangerous.'],
    seeAlso: ['Incapacitated [Condition]', 'Prone', 'Death Saving Throw']
  },
  {
    term: 'Vulnerability',
    category: 'Combat',
    summary: 'Vulnerability causes damage of a specific type to be doubled.',
    details: ['Apply it once to the relevant damage instance.', 'It is the opposite of resistance and can make certain tactics extremely strong.'],
    seeAlso: ['Resistance', 'Damage Types']
  },
  {
    term: 'Weapon Attack',
    category: 'Combat',
    summary: 'A weapon attack is an attack roll made with a weapon rather than with pure magic.',
    details: ['Melee and ranged weapon attacks both fall under this wording.', 'Many class features care about whether an attack was made with a weapon.'],
    seeAlso: ['Attack Roll', 'Attack [Action]']
  },
  {
    term: 'Darkvision',
    category: 'Exploration',
    summary: 'Darkvision lets a creature function in darkness better than normal sight allows.',
    details: ['It usually treats darkness as dim light within a limited range.', 'Color detail is often reduced even when shapes stay visible.'],
    seeAlso: ['Darkness', 'Bright Light']
  },
  {
    term: 'Death Saving Throw',
    category: 'Core',
    summary: 'A character at 0 hit points often has to make death saves to avoid dying outright.',
    details: ['These rolls track whether the character stabilizes or slips closer to death.', 'Healing or stabilization can end the crisis before it gets worse.'],
    seeAlso: ['Hit Points', 'Unconscious [Condition]']
  },
  {
    term: 'Healing',
    category: 'Combat',
    summary: 'Healing restores lost hit points but cannot raise a creature above its normal maximum.',
    details: ['It reverses damage but does not usually remove every condition or penalty.', 'Temporary hit points are not the same thing as healing.'],
    seeAlso: ['Hit Points', 'Temporary Hit Points']
  },
  {
    term: 'Heavily Obscured',
    category: 'Exploration',
    summary: 'A heavily obscured area blocks sight so thoroughly that creatures effectively cannot see through it.',
    details: ['This often comes from thick darkness, dense fog, or similar conditions.', 'It strongly affects hiding, targeting, and awareness.'],
    seeAlso: ['Darkness', 'Hide', 'Blinded [Condition]']
  },
  {
    term: 'Hit Points',
    category: 'Core',
    summary: 'Hit points measure how much punishment a creature or object can take before going down.',
    details: ['Damage lowers them and healing restores them.', 'You cannot normally exceed your maximum or go below 0.'],
    seeAlso: ['Healing', 'Temporary Hit Points', 'Death Saving Throw']
  },
  {
    term: 'Lightly Obscured',
    category: 'Exploration',
    summary: 'A lightly obscured area makes seeing details harder without fully blocking line of sight.',
    details: ['Dim light and thin mist are common examples.', 'Perception checks that rely on sight are usually worse there.'],
    seeAlso: ['Bright Light', 'Dim Light', 'Passive Perception']
  },
  {
    term: 'Paralyzed [Condition]',
    category: 'Conditions',
    summary: 'A paralyzed creature is frozen in place and extremely vulnerable to nearby attacks.',
    details: ['It is incapacitated and automatically fails Strength and Dexterity saves.', 'Melee hits from close range become especially punishing.'],
    seeAlso: ['Stunned [Condition]', 'Unconscious [Condition]']
  },
  {
    term: 'Surprise',
    category: 'Combat',
    summary: 'Surprise represents being caught unready at the start of a fight.',
    details: ['It usually affects initiative rather than removing turns entirely.', 'Stealth, awareness, and positioning all matter in creating it.'],
    seeAlso: ['Initiative', 'Hide']
  },
  {
    term: 'Swimming',
    category: 'Movement',
    summary: 'Swimming usually costs extra movement unless a creature has a swim speed.',
    details: ['Strong currents or rough conditions may demand checks.', 'Water encounters often change positioning and escape options dramatically.'],
    seeAlso: ['Swim Speed', 'Speed']
  }
];

const GLOSSARY_REFERENCE_MAP = buildGlossaryReferenceMap(RULES_GLOSSARY_TERMS);
const GLOSSARY_REFERENCE_REGEX = new RegExp(
  `(?<![A-Za-z])(${Array.from(GLOSSARY_REFERENCE_MAP.keys())
    .sort((left, right) => right.length - left.length)
    .map(escapeRegExp)
    .join('|')})(?![A-Za-z])`,
  'gi'
);

@Component({
  selector: 'app-rules-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './rules-detail-page.html',
  styleUrl: './rules-detail-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RulesDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly document = inject(DOCUMENT);

  readonly entry = signal<RulesLink | null>(null);
  readonly equipmentSearchTerm = signal('');
  readonly selectedEquipmentCategory = signal('All');
  readonly expandedEquipmentName = signal<string | null>(null);
  readonly glossarySearchTerm = signal('');
  readonly selectedGlossaryCategory = signal('All');
  readonly isEquipmentPage = computed(() => this.entry()?.slug === 'equipment');
  readonly isMagicItemsPage = computed(() => this.entry()?.slug === 'magic-items');
  readonly isBasicRulesPage = computed(() => this.entry()?.slug === 'basic-rules');
  readonly isRulesGlossaryPage = computed(() => this.entry()?.slug === 'rules-glossary');
  readonly isCatalogPage = computed(() => this.isEquipmentPage() || this.isMagicItemsPage());
  readonly glossaryConventions = GLOSSARY_CONVENTIONS;
  readonly glossaryAbbreviations = GLOSSARY_ABBREVIATIONS;
  readonly glossaryAlphabet = GLOSSARY_ALPHABET;
  readonly equipmentCategories = computed(() => {
    const categories = new Set(
      this.catalogItems()
        .map((item) => item.category?.trim())
        .filter((category): category is string => Boolean(category))
    );

    return ['All', ...Array.from(categories).sort((left, right) => left.localeCompare(right))];
  });
  readonly filteredEquipmentItems = computed(() => {
    if (!this.isCatalogPage()) {
      return [] as ReadonlyArray<EquipmentItem>;
    }

    const search = this.equipmentSearchTerm().trim().toLowerCase();
    const selectedCategory = this.selectedEquipmentCategory();

    return this.catalogItems().filter((item) => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      if (!matchesCategory) {
        return false;
      }

      if (!search) {
        return true;
      }

      const haystack = [item.name, item.category, item.summary, item.notes, ...(item.detailLines ?? [])]
        .filter((value): value is string => Boolean(value?.trim()))
        .join(' ')
        .toLowerCase();

      return haystack.includes(search);
    });
  });
  readonly glossaryCategories = computed(() => ['All', ...Array.from(new Set(RULES_GLOSSARY_TERMS.map((term) => term.category)))]);
  readonly filteredGlossaryTerms = computed<ReadonlyArray<GlossaryTerm>>(() => {
    if (!this.isRulesGlossaryPage()) {
      return [];
    }

    const search = this.glossarySearchTerm().trim().toLowerCase();
    const selectedCategory = this.selectedGlossaryCategory();

    return RULES_GLOSSARY_TERMS.filter((term) => {
      const matchesCategory = selectedCategory === 'All' || term.category === selectedCategory;
      if (!matchesCategory) {
        return false;
      }

      if (!search) {
        return true;
      }

      const haystack = [term.term, term.tag, term.category, term.summary, ...term.details, ...(term.seeAlso ?? [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(search);
    });
  });
  readonly glossaryTermGroups = computed(() => {
    const groups = new Map<string, GlossaryTerm[]>();

    for (const term of this.filteredGlossaryTerms()) {
      const letter = term.term.charAt(0).toUpperCase();
      const existing = groups.get(letter) ?? [];
      existing.push(term);
      groups.set(letter, existing);
    }

    return Array.from(groups.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([letter, terms]) => ({
        letter,
        terms: [...terms].sort((left, right) => left.term.localeCompare(right.term))
      }));
  });
  readonly glossaryAvailableLetters = computed(() => new Set(this.glossaryTermGroups().map((group) => group.letter)));
  readonly relatedEntries = computed(() => {
    const currentEntry = this.entry();

    if (!currentEntry) {
      return [];
    }

    return currentEntry.relatedSlugs
      .map((slug) => getRulesEntryBySlug(slug))
      .filter((entry): entry is RulesLink => entry !== null);
  });

  constructor() {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((paramMap) => {
        const slug = paramMap.get('slug');
        this.entry.set(slug ? getRulesEntryBySlug(slug) : null);
        this.equipmentSearchTerm.set('');
        this.selectedEquipmentCategory.set('All');
        this.expandedEquipmentName.set(null);
        this.glossarySearchTerm.set('');
        this.selectedGlossaryCategory.set('All');
        this.cdr.detectChanges();
      });
  }

  private scrollToGlossaryAnchor(anchorId: string): void {
    this.document.getElementById(anchorId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  private resolveGlossaryReference(reference: string): string | null {
    return GLOSSARY_REFERENCE_MAP.get(normalizeGlossaryAlias(reference)) ?? null;
  }

  private catalogItems(): ReadonlyArray<EquipmentItem> {
    if (this.isMagicItemsPage()) {
      return equipmentCatalog.filter((item) =>
        MAGIC_ITEM_CATEGORIES.has(item.category) || Boolean(item.rarity?.trim()) || Boolean(item.attunement?.trim())
      );
    }

    return equipmentCatalog;
  }

  onEquipmentSearchChanged(value: string): void {
    this.equipmentSearchTerm.set(value);
  }

  onEquipmentCategorySelected(category: string): void {
    this.selectedEquipmentCategory.set(category);
  }

  onGlossarySearchChanged(value: string): void {
    this.glossarySearchTerm.set(value);
  }

  onGlossaryCategorySelected(category: string): void {
    this.selectedGlossaryCategory.set(category);
  }

  jumpToGlossaryLetter(letter: string): void {
    this.scrollToGlossaryAnchor(`glossary-${letter}`);
  }

  jumpToGlossaryTerm(reference: string): void {
    const target = this.resolveGlossaryReference(reference);
    if (!target) {
      return;
    }

    this.selectedGlossaryCategory.set('All');
    this.glossarySearchTerm.set('');
    this.cdr.detectChanges();
    queueMicrotask(() => this.scrollToGlossaryAnchor(this.glossaryAnchorId(target)));
  }

  glossaryAnchorId(term: string): string {
    return `glossary-term-${term.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
  }

  isGlossaryReference(reference: string): boolean {
    return this.resolveGlossaryReference(reference) !== null;
  }

  glossaryTextSegments(text: string): GlossaryTextSegment[] {
    if (!text) {
      return [];
    }

    const segments: GlossaryTextSegment[] = [];
    let lastIndex = 0;

    for (const match of text.matchAll(GLOSSARY_REFERENCE_REGEX)) {
      const index = match.index ?? 0;
      const matchedText = match[0];
      const target = this.resolveGlossaryReference(matchedText);

      if (index > lastIndex) {
        segments.push({ text: text.slice(lastIndex, index) });
      }

      segments.push(target ? { text: matchedText, target } : { text: matchedText });
      lastIndex = index + matchedText.length;
    }

    if (lastIndex < text.length) {
      segments.push({ text: text.slice(lastIndex) });
    }

    return segments;
  }

  sectionEntryRoute(entry: RulesSectionEntry): string | null {
    if (!entry.routeSlug) {
      return null;
    }

    return getRulesEntryBySlug(entry.routeSlug)?.routePath ?? null;
  }

  toggleEquipmentDetails(item: EquipmentItem): void {
    this.expandedEquipmentName.update((current) => current === item.name ? null : item.name);
  }

  isEquipmentExpanded(item: EquipmentItem): boolean {
    return this.expandedEquipmentName() === item.name;
  }

  equipmentDescription(item: EquipmentItem): string | null {
    const summary = item.summary?.trim();
    const notes = item.notes?.trim();

    if (summary && !this.isGenericEquipmentSummary(summary)) {
      return summary;
    }

    return notes || summary || null;
  }

  equipmentDetailLines(item: EquipmentItem): string[] {
    const mergedLines: string[] = [];

    for (const rawLine of item.detailLines ?? []) {
      const line = rawLine.replace(/\s+/g, ' ').trim();
      if (!line) {
        continue;
      }

      const previousIndex = mergedLines.length - 1;
      if (previousIndex >= 0 && (/^[a-z(]/.test(line) || !/[.!?]$/.test(mergedLines[previousIndex]))) {
        mergedLines[previousIndex] = `${mergedLines[previousIndex]} ${line}`.replace(/\s+/g, ' ').trim();
        continue;
      }

      mergedLines.push(line);
    }

    const seen = new Set<string>();
    const description = this.normalizeEquipmentText(this.equipmentDescription(item) ?? '');

    return mergedLines.filter((line) => {
      const normalized = this.normalizeEquipmentText(line);
      if (!normalized || normalized === description || seen.has(normalized)) {
        return false;
      }

      if (description && description.includes(normalized)) {
        return false;
      }

      seen.add(normalized);
      return true;
    });
  }

  equipmentSpellRows(item: EquipmentItem): Array<{ spell: string; details: string }> {
    const sourceText = [item.notes, ...(item.detailLines ?? [])]
      .filter((value): value is string => Boolean(value?.trim()))
      .join(' ');

    if (!sourceText) {
      return [];
    }

    const rows: Array<{ spell: string; details: string }> = [];
    const seen = new Set<string>();

    const addRow = (spell: string, details?: string) => {
      const cleanedSpell = spell
        .replace(/^(?:or|and|either)\s+/i, '')
        .replace(/\bspell\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

      const cleanedDetails = details?.replace(/\s+/g, ' ').trim() || '—';
      const key = `${cleanedSpell.toLowerCase()}|${cleanedDetails.toLowerCase()}`;

      if (!cleanedSpell || !/^[A-Z]/.test(cleanedSpell) || seen.has(key)) {
        return;
      }

      seen.add(key);
      rows.push({ spell: cleanedSpell, details: cleanedDetails });
    };

    for (const match of sourceText.matchAll(/cast(?: one of the following spells)?(?: from [^:.;]+)?(?:, using [^:.;]+)?\s*:\s*([^.]*)\./gi)) {
      for (const entry of this.parseSpellEntries(match[1])) {
        addRow(entry.spell, entry.details);
      }
    }

    for (const match of sourceText.matchAll(/cast either\s+([^.]+?)\./gi)) {
      for (const entry of this.parseSpellEntries(match[1])) {
        addRow(entry.spell, entry.details);
      }
    }

    for (const match of sourceText.matchAll(/cast\s+(?:the\s+)?([A-Z][A-Za-z'’]+(?:\s+(?:[A-Z][A-Za-z'’]+|of|the|and|or|via|with))*?)(?:\s+spell)?(?:\s+from\s+[^.]+?)?(?:\s*\(([^)]*)\))?(?=[.,;])/g)) {
      addRow(match[1], match[2]);
    }

    return rows;
  }

  private parseSpellEntries(value: string): Array<{ spell: string; details: string }> {
    const normalized = value.replace(/\s+/g, ' ').trim();
    const commaParts = this.splitSpellList(normalized);
    const parts = commaParts.length > 1
      ? commaParts
      : normalized.replace(/^either\s+/i, '').split(/\s+or\s+/i);

    return parts
      .map((part) => part.replace(/^(?:or|and)\s+/i, '').trim())
      .map((part) => {
        const cleanedPart = part
          .replace(/\s+(?:from|with)\s+(?:it|the [A-Za-z'’ -]+)$/i, '')
          .trim();
        const match = cleanedPart.match(/^(.*?)(?:\s*\(([^)]*)\))?$/);
        return {
          spell: match?.[1]?.trim() ?? cleanedPart,
          details: match?.[2]?.trim() ?? '—'
        };
      })
      .filter((entry) => Boolean(entry.spell));
  }

  private splitSpellList(value: string): string[] {
    const parts: string[] = [];
    let current = '';
    let depth = 0;

    for (const character of value) {
      if (character === '(') {
        depth += 1;
      } else if (character === ')' && depth > 0) {
        depth -= 1;
      }

      if (character === ',' && depth === 0) {
        if (current.trim()) {
          parts.push(current.trim());
        }
        current = '';
        continue;
      }

      current += character;
    }

    if (current.trim()) {
      parts.push(current.trim());
    }

    return parts;
  }

  private isGenericEquipmentSummary(value: string): boolean {
    return /dedicated rules entry in its source material|^(armor|weapon|potion|staff|rod|ring|wand|scroll)\b.*\.$/i.test(value);
  }

  private normalizeEquipmentText(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[.,;:!?]+/g, '')
      .replace(/\s+/g, ' ');
  }
}
