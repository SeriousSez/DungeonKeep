import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, ElementRef, HostListener, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { DropdownComponent, DropdownOption } from '../../components/dropdown/dropdown.component';
import { CustomMonster, MonsterCatalogEntry, MonsterTextSectionEntry } from '../../models/monster-reference.models';
import { monsterCatalog } from '../../data/monster-catalog.generated';
import { createBlankCustomMonster, createCustomMonsterFromTemplate, sanitizeCustomMonster, touchCustomMonster } from '../../data/monster-library.helpers';
import { loadMonsterLibrary, saveMonsterLibrary } from '../../data/monster-library.storage';

const SIZE_OPTIONS: DropdownOption[] = [
    { value: 'Tiny', label: 'Tiny' },
    { value: 'Small', label: 'Small' },
    { value: 'Medium', label: 'Medium' },
    { value: 'Large', label: 'Large' },
    { value: 'Huge', label: 'Huge' },
    { value: 'Gargantuan', label: 'Gargantuan' }
];

const CATEGORY_OPTIONS: DropdownOption[] = [
    { value: 'Aberration', label: 'Aberration' },
    { value: 'Beast', label: 'Beast' },
    { value: 'Celestial', label: 'Celestial' },
    { value: 'Construct', label: 'Construct' },
    { value: 'Dragon', label: 'Dragon' },
    { value: 'Elemental', label: 'Elemental' },
    { value: 'Fey', label: 'Fey' },
    { value: 'Fiend', label: 'Fiend' },
    { value: 'Giant', label: 'Giant' },
    { value: 'Humanoid', label: 'Humanoid' },
    { value: 'Monstrosity', label: 'Monstrosity' },
    { value: 'Ooze', label: 'Ooze' },
    { value: 'Plant', label: 'Plant' },
    { value: 'Undead', label: 'Undead' },
    { value: 'Other', label: 'Other' }
];

interface SectionSuggestion {
    title: string;
    text: string;
}

const SECTION_SUGGESTIONS: Record<SectionKey, readonly SectionSuggestion[]> = {
    traits: [
        { title: 'Aggressive', text: 'As a bonus action, the creature can move up to its speed toward a hostile creature that it can see.' },
        { title: 'Amphibious', text: 'The creature can breathe air and water.' },
        { title: 'Antimagic Susceptibility', text: 'The creature is incapacitated while in the area of an antimagic field. If targeted by dispel magic, the creature must succeed on a Constitution saving throw against the caster\'s spell save DC or fall unconscious until the end of the caster\'s next turn.' },
        { title: 'Brave', text: 'The creature has advantage on saving throws against being frightened.' },
        { title: 'Brute', text: 'A melee weapon deals one extra die of its damage when the creature hits with it (included in the attack).' },
        { title: 'Charge', text: 'If the creature moves at least 20 feet straight toward a target and then hits it with a melee attack on the same turn, the target takes an extra 7 (2d6) damage. If the target is a creature, it must succeed on a DC 15 Strength saving throw or be knocked prone.' },
        { title: 'Cunning Action', text: 'On each of its turns, the creature can use a bonus action to take the Dash, Disengage, or Hide action.' },
        { title: 'Darkvision', text: 'The creature has darkvision to a range of 60 feet.' },
        { title: "Devil's Sight", text: "Magical darkness doesn't impede the creature's darkvision." },
        { title: 'Evasion', text: 'If the creature is subjected to an effect that allows it to make a Dexterity saving throw to take only half damage, it instead takes no damage if it succeeds on the saving throw, and only half damage if it fails.' },
        { title: 'False Appearance', text: 'While the creature remains motionless, it is indistinguishable from an ordinary object.' },
        { title: 'Fey Ancestry', text: 'The creature has advantage on saving throws against being charmed, and magic can\'t put the creature to sleep.' },
        { title: 'Flyby', text: 'The creature doesn\'t provoke opportunity attacks when it flies out of an enemy\'s reach.' },
        { title: 'Hold Breath', text: 'The creature can hold its breath for 15 minutes.' },
        { title: 'Illumination', text: 'The creature sheds bright light in a 10-foot radius and dim light for an additional 10 feet.' },
        { title: 'Immutable Form', text: 'The creature is immune to any spell or effect that would alter its form.' },
        { title: 'Incorporeal Movement', text: 'The creature can move through other creatures and objects as if they were difficult terrain. It takes 5 (1d10) force damage if it ends its turn inside an object.' },
        { title: 'Innate Spellcasting', text: "The creature's innate spellcasting ability is [ABILITY] (spell save DC [DC]). The creature can innately cast the following spells, requiring no material components:\nAt will: [spell1]\n3/day each: [spell2], [spell3]\n1/day each: [spell4]" },
        { title: 'Keen Hearing and Smell', text: 'The creature has advantage on Wisdom (Perception) checks that rely on hearing or smell.' },
        { title: 'Keen Sight', text: 'The creature has advantage on Wisdom (Perception) checks that rely on sight.' },
        { title: 'Keen Smell', text: 'The creature has advantage on Wisdom (Perception) checks that rely on smell.' },
        { title: 'Legendary Resistance (3/Day)', text: 'If the creature fails a saving throw, it can choose to succeed instead.' },
        { title: 'Light Sensitivity', text: 'While in bright light, the creature has disadvantage on attack rolls, as well as on Wisdom (Perception) checks that rely on sight.' },
        { title: 'Magic Resistance', text: 'The creature has advantage on saving throws against spells and other magical effects.' },
        { title: 'Magic Weapons', text: "The creature's weapon attacks are magical." },
        { title: 'Nimble Escape', text: 'The creature can take the Disengage or Hide action as a bonus action on each of its turns.' },
        { title: 'Pack Tactics', text: 'The creature has advantage on an attack roll against a creature if at least one of the creature\'s allies is adjacent to the target and the ally isn\'t incapacitated.' },
        { title: 'Pounce', text: 'If the creature moves at least 20 feet straight toward a creature and then hits it with a claw attack on the same turn, that target must succeed on a DC 13 Strength saving throw or be knocked prone. If the target is prone, the creature can make one bite attack against it as a bonus action.' },
        { title: 'Rampage', text: 'When the creature reduces a creature to 0 hit points with a melee attack on its turn, the creature can take a bonus action to move up to half its speed and make a bite attack.' },
        { title: 'Reckless', text: 'At the start of its turn, the creature can gain advantage on all melee weapon attack rolls during that turn, but attack rolls against it have advantage until the start of its next turn.' },
        { title: 'Regeneration', text: 'The creature regains 10 hit points at the start of its turn. If the creature takes acid or fire damage, this trait doesn\'t function at the start of its next turn. The creature dies only if it starts its turn with 0 hit points and doesn\'t regenerate.' },
        { title: 'Relentless (Recharges after a Short or Long Rest)', text: 'If the creature takes 14 or more damage that would reduce it to 0 hit points, it is reduced to 1 hit point instead.' },
        { title: 'Shadow Stealth', text: 'While in dim light or darkness, the creature can take the Hide action as a bonus action. Its stealth is also especially effective. Whenever it tries to hide, it can opt to not roll but automatically succeed.' },
        { title: 'Shapechanger', text: 'The creature can use its action to polymorph into a specific alternate form, or back into its true form. Its statistics, other than its size, are the same in each form. Any equipment it is wearing or carrying isn\'t transformed. It reverts to its true form if it dies.' },
        { title: 'Siege Monster', text: 'The creature deals double damage to objects and structures.' },
        { title: 'Spellcasting', text: 'The creature is a spellcaster. Its spellcasting ability is [ABILITY] (spell save DC [DC], +[BONUS] to hit with spell attacks). The creature has the following spells prepared:\nCantrips (at will): [cantrip1], [cantrip2]\n1st level (4 slots): [spell1], [spell2]\n2nd level (3 slots): [spell1], [spell2]' },
        { title: 'Spider Climb', text: 'The creature can climb difficult surfaces, including upside down on ceilings, without needing to make an ability check.' },
        { title: 'Standing Leap', text: "The creature's long jump is up to 20 feet and its high jump is up to 10 feet, with or without a running start." },
        { title: 'Stench', text: 'Any creature that starts its turn within 5 feet of the creature must succeed on a DC 13 Constitution saving throw or be poisoned until the start of its next turn. On a successful saving throw, the creature is immune to the creature\'s Stench for 24 hours.' },
        { title: 'Sunlight Sensitivity', text: 'While in sunlight, the creature has disadvantage on attack rolls, as well as on Wisdom (Perception) checks that rely on sight.' },
        { title: 'Sure-Footed', text: 'The creature has advantage on Strength and Dexterity saving throws made against effects that would knock it prone.' },
        { title: 'Telepathy', text: 'The creature can magically communicate simple ideas, emotions, and images telepathically with any creature within 100 feet of it that can understand a language.' },
        { title: 'Trampling Charge', text: 'If the creature moves at least 20 feet straight toward a creature and then hits it with a gore attack on the same turn, that target must succeed on a DC 13 Strength saving throw or be knocked prone. If the target is prone, the creature can make one stomp attack against it as a bonus action.' },
        { title: 'Tunneler', text: 'The creature can burrow through solid rock at half its burrowing speed and leaves a 5-foot-wide, 5-foot-tall tunnel in its wake.' },
        { title: 'Undead Fortitude', text: 'If damage reduces the creature to 0 hit points, it must make a Constitution saving throw with a DC of 5 + the damage taken, unless the damage is radiant or from a critical hit. On a success, the creature drops to 1 hit point instead.' },
        { title: 'Undead Nature', text: 'The creature doesn\'t require air, food, drink, or sleep.' },
        { title: 'Water Breathing', text: 'The creature can breathe only underwater.' },
        { title: 'Web Sense', text: 'While in contact with a web, the creature knows the exact location of any other creature in contact with the same web.' },
        { title: 'Web Walker', text: 'The creature ignores movement restrictions caused by webbing.' }
    ],
    actions: [
        // Multiattack
        { title: 'Multiattack', text: 'The creature makes two attacks.' },
        { title: 'Multiattack (Bite and Claws)', text: 'The creature makes one bite attack and two claw attacks.' },
        { title: 'Multiattack (Three Attacks)', text: 'The creature makes three attacks.' },
        { title: 'Multiattack (Weapon and Spell)', text: 'The creature makes two weapon attacks. It can substitute one of those attacks for a cantrip.' },
        // Natural attacks
        { title: 'Bite', text: 'Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 10 (2d6 + 3) piercing damage.' },
        { title: 'Claw', text: 'Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 8 (2d4 + 3) slashing damage.' },
        { title: 'Claws', text: 'Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 8 (2d4 + 3) slashing damage.' },
        { title: 'Constrict', text: 'Melee Weapon Attack: +5 to hit, reach 5 ft., one Medium or smaller creature. Hit: 10 (2d6 + 3) bludgeoning damage, and the target is grappled (escape DC 13). Until this grapple ends, the creature can\'t constrict another target.' },
        { title: 'Gore', text: 'Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 10 (2d6 + 3) piercing damage.' },
        { title: 'Grapple', text: 'Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 8 (2d4 + 3) bludgeoning damage, and the target is grappled (escape DC 13).' },
        { title: 'Slam', text: 'Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 10 (2d6 + 3) bludgeoning damage.' },
        { title: 'Stinger', text: 'Melee Weapon Attack: +5 to hit, reach 5 ft., one creature. Hit: 7 (1d6 + 4) piercing damage, and the target must make a DC 13 Constitution saving throw, taking 18 (4d8) poison damage on a failed save, or half as much damage on a successful one. If the poison damage reduces the target to 0 hit points, the target is stable but poisoned for 1 hour, even after regaining hit points, and is paralyzed while poisoned this way.' },
        { title: 'Stomp', text: 'Melee Weapon Attack: +5 to hit, reach 5 ft., one prone creature. Hit: 14 (3d6 + 4) bludgeoning damage.' },
        { title: 'Tail', text: 'Melee Weapon Attack: +5 to hit, reach 10 ft., one target. Hit: 12 (2d8 + 3) bludgeoning damage.' },
        { title: 'Tentacle', text: 'Melee Weapon Attack: +5 to hit, reach 10 ft., one target. Hit: 10 (2d6 + 3) bludgeoning damage. If the target is a Medium or smaller creature, it is grappled (escape DC 13).' },
        // Melee weapons
        { title: 'Battleaxe', text: 'Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 7 (1d8 + 3) slashing damage, or 8 (1d10 + 3) slashing damage if used with two hands.' },
        { title: 'Club', text: 'Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 4 (1d4 + 2) bludgeoning damage.' },
        { title: 'Dagger', text: 'Melee or Ranged Weapon Attack: +5 to hit, reach 5 ft. or range 20/60 ft., one target. Hit: 4 (1d4 + 2) piercing damage.' },
        { title: 'Flail', text: 'Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 7 (1d8 + 3) bludgeoning damage.' },
        { title: 'Glaive', text: 'Melee Weapon Attack: +5 to hit, reach 10 ft., one target. Hit: 8 (1d10 + 3) slashing damage.' },
        { title: 'Greataxe', text: 'Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 9 (1d12 + 3) slashing damage.' },
        { title: 'Greatsword', text: 'Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 10 (2d6 + 3) slashing damage.' },
        { title: 'Halberd', text: 'Melee Weapon Attack: +5 to hit, reach 10 ft., one target. Hit: 8 (1d10 + 3) slashing damage.' },
        { title: 'Handaxe', text: 'Melee or Ranged Weapon Attack: +5 to hit, reach 5 ft. or range 20/60 ft., one target. Hit: 5 (1d6 + 2) slashing damage.' },
        { title: 'Javelin', text: 'Melee or Ranged Weapon Attack: +5 to hit, reach 5 ft. or range 30/120 ft., one target. Hit: 6 (1d6 + 3) piercing damage.' },
        { title: 'Lance', text: 'Melee Weapon Attack: +5 to hit, reach 10 ft., one target. Hit: 9 (1d12 + 3) piercing damage.' },
        { title: 'Longsword', text: 'Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 7 (1d8 + 3) slashing damage, or 8 (1d10 + 3) slashing damage if used with two hands.' },
        { title: 'Mace', text: 'Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 6 (1d6 + 3) bludgeoning damage.' },
        { title: 'Maul', text: 'Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 10 (2d6 + 3) bludgeoning damage.' },
        { title: 'Morningstar', text: 'Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 7 (1d8 + 3) piercing damage.' },
        { title: 'Pike', text: 'Melee Weapon Attack: +5 to hit, reach 10 ft., one target. Hit: 8 (1d10 + 3) piercing damage.' },
        { title: 'Quarterstaff', text: 'Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) bludgeoning damage, or 6 (1d8 + 2) bludgeoning damage if used with two hands.' },
        { title: 'Rapier', text: 'Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 7 (1d8 + 3) piercing damage.' },
        { title: 'Scimitar', text: 'Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) slashing damage.' },
        { title: 'Shortsword', text: 'Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 6 (1d6 + 3) piercing damage.' },
        { title: 'Spear', text: 'Melee or Ranged Weapon Attack: +5 to hit, reach 5 ft. or range 20/60 ft., one target. Hit: 6 (1d6 + 3) piercing damage.' },
        { title: 'Trident', text: 'Melee or Ranged Weapon Attack: +5 to hit, reach 5 ft. or range 20/60 ft., one target. Hit: 6 (1d6 + 3) piercing damage, or 7 (1d8 + 3) piercing damage if used with two hands.' },
        { title: 'War Pick', text: 'Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 7 (1d8 + 3) piercing damage.' },
        { title: 'Warhammer', text: 'Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 7 (1d8 + 3) bludgeoning damage, or 8 (1d10 + 3) bludgeoning damage if used with two hands.' },
        { title: 'Whip', text: 'Melee Weapon Attack: +5 to hit, reach 10 ft., one target. Hit: 4 (1d4 + 2) slashing damage.' },
        // Ranged weapons
        { title: 'Blowgun', text: 'Ranged Weapon Attack: +5 to hit, range 25/100 ft., one target. Hit: 3 (1 + 2) piercing damage.' },
        { title: 'Crossbow', text: 'Ranged Weapon Attack: +5 to hit, range 100/400 ft., one target. Hit: 7 (1d8 + 3) piercing damage.' },
        { title: 'Dart', text: 'Ranged Weapon Attack: +5 to hit, range 20/60 ft., one target. Hit: 4 (1d4 + 2) piercing damage.' },
        { title: 'Hand Crossbow', text: 'Ranged Weapon Attack: +5 to hit, range 30/120 ft., one target. Hit: 5 (1d6 + 2) piercing damage.' },
        { title: 'Heavy Crossbow', text: 'Ranged Weapon Attack: +5 to hit, range 100/400 ft., one target. Hit: 8 (1d10 + 3) piercing damage.' },
        { title: 'Light Crossbow', text: 'Ranged Weapon Attack: +5 to hit, range 80/320 ft., one target. Hit: 6 (1d8 + 2) piercing damage.' },
        { title: 'Longbow', text: 'Ranged Weapon Attack: +5 to hit, range 150/600 ft., one target. Hit: 7 (1d8 + 3) piercing damage.' },
        { title: 'Net', text: 'Ranged Weapon Attack: +5 to hit, range 5/15 ft., one Large or smaller creature. Hit: The target is restrained until it is freed. A creature can use its action to make a DC 10 Strength check, freeing itself or another creature within its reach on a success. Dealing 5 slashing damage to the net (AC 10) frees the target without harming it.' },
        { title: 'Poison Spit', text: 'Ranged Weapon Attack: +5 to hit, range 15/30 ft., one creature. Hit: 9 (2d8) poison damage, and the target must succeed on a DC 13 Constitution saving throw or be poisoned until the end of its next turn.' },
        { title: 'Shortbow', text: 'Ranged Weapon Attack: +5 to hit, range 80/320 ft., one target. Hit: 6 (1d6 + 3) piercing damage.' },
        { title: 'Sling', text: 'Ranged Weapon Attack: +5 to hit, range 30/120 ft., one target. Hit: 4 (1d4 + 2) bludgeoning damage.' },
        { title: 'Tail Spike', text: 'Ranged Weapon Attack: +5 to hit, range 100/200 ft., one target. Hit: 9 (1d8 + 5) piercing damage.' },
        // Breath weapons & area attacks
        { title: 'Acid Breath', text: 'The creature exhales acid in a 30-foot line that is 5 feet wide. Each creature in that line must make a DC 13 Dexterity saving throw, taking 40 (9d8) acid damage on a failed save, or half as much damage on a successful one.' },
        { title: 'Breath Weapon (Recharge 5–6)', text: 'The creature uses one of the following breath weapons.\n[Damage Type] Breath. The creature exhales [damage type] in a [area]. Each creature in that area must make a DC [DC] [ABILITY] saving throw, taking [DICE] [damage type] damage on a failed save, or half as much damage on a successful one.' },
        { title: 'Cold Breath', text: 'The creature exhales an icy blast in a 30-foot cone. Each creature in that area must make a DC 15 Constitution saving throw, taking 45 (10d8) cold damage on a failed save, or half as much damage on a successful one.' },
        { title: 'Fire Breath', text: 'The creature exhales fire in a 30-foot cone. Each creature in that area must make a DC 15 Dexterity saving throw, taking 45 (13d6) fire damage on a failed save, or half as much damage on a successful one.' },
        { title: 'Lightning Breath', text: 'The creature exhales lightning in a 60-foot line that is 5 feet wide. Each creature in that line must make a DC 15 Dexterity saving throw, taking 55 (10d10) lightning damage on a failed save, or half as much damage on a successful one.' },
        { title: 'Poison Breath', text: 'The creature exhales poisonous gas in a 15-foot cone. Each creature in that area must make a DC 13 Constitution saving throw, taking 42 (12d6) poison damage on a failed save, or half as much damage on a successful one.' },
        { title: 'Stench Cloud (Recharge 6)', text: 'The creature belches a cloud of noxious gas in a 20-foot-radius sphere centered on itself. The gas spreads around corners and remains for 1 minute or until dispersed by wind. Each creature in the area must succeed on a DC 13 Constitution saving throw or be poisoned for 1 minute. A poisoned creature can repeat the saving throw at the end of each of its turns, ending the effect on a success.' },
        { title: 'Thunder Breath', text: 'The creature exhales a blast of crackling thunder in a 15-foot cone. Each creature in the area must make a DC 13 Constitution saving throw, taking 35 (10d6) thunder damage on a failed save, or half as much on a success. A creature that fails the saving throw is also deafened until the end of its next turn.' },
        // Special abilities
        { title: 'Change Shape', text: 'The creature magically polymorphs into a creature that has a challenge rating no higher than its own, or back into its true form. It reverts to its true form if it dies. Any equipment it is wearing or carrying is absorbed or borne by the new form (the creature\'s choice). In a new form, the creature retains its alignment, hit points, Hit Dice, ability to speak, proficiencies, Legendary Resistance, lair actions, and Intelligence, Wisdom, and Charisma scores, as well as this action. Its statistics and capabilities are otherwise replaced by those of the new form, except any class features or legendary actions of that form.' },
        { title: 'Charm', text: "The creature targets one humanoid it can see within 30 feet of it. If the target can see the creature, the target must succeed on a DC 13 Wisdom saving throw against this magic or be charmed by the creature. The charmed target regards the creature as a trusted friend to be heeded and protected. Although the target isn't under the creature's control, it takes the creature's requests or actions in the most favorable way it can." },
        { title: 'Corrupting Touch', text: 'Melee Spell Attack: +5 to hit, reach 5 ft., one target. Hit: 17 (3d10 + 1) necrotic damage.' },
        { title: 'Frightful Presence', text: 'Each creature of the creature\'s choice that is within 120 feet of the creature and aware of it must succeed on a DC 16 Wisdom saving throw or become frightened for 1 minute. A creature can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success. If a creature\'s saving throw is successful or the effect ends for it, the creature is immune to this creature\'s Frightful Presence for the next 24 hours.' },
        { title: 'Hypnotic Gaze', text: "The creature's gaze targets one creature within 30 feet. If the target can see the creature, the target must succeed on a DC [DC] Wisdom saving throw against this magic or be stunned until the end of its next turn." },
        { title: 'Innate Spellcasting', text: "The creature's innate spellcasting ability is [ABILITY] (spell save DC [DC]). The creature can innately cast the following spells, requiring no material components:\nAt will: [spell1]\n3/day each: [spell2], [spell3]\n1/day each: [spell4]" },
        { title: 'Life Drain', text: 'Melee Weapon Attack: +5 to hit, reach 5 ft., one creature. Hit: 14 (3d6 + 4) necrotic damage. The target must succeed on a DC 13 Constitution saving throw or its hit point maximum is reduced by an amount equal to the damage taken. This reduction lasts until the creature finishes a long rest. The target dies if this effect reduces its hit point maximum to 0.' },
        { title: 'Paralyzing Touch', text: 'Melee Spell Attack: +5 to hit, reach 5 ft., one creature. Hit: 10 (3d6) cold damage. The target must succeed on a DC 13 Constitution saving throw or be paralyzed for 1 minute. The target can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success.' },
        { title: 'Spellcasting', text: 'The creature is a spellcaster. Its spellcasting ability is [ABILITY] (spell save DC [DC], +[BONUS] to hit with spell attacks). The creature has the following spells prepared:\nCantrips (at will): [cantrip1], [cantrip2]\n1st level (4 slots): [spell1], [spell2]\n2nd level (3 slots): [spell1], [spell2]' },
        { title: 'Summon', text: 'The creature attempts to magically summon [CREATURE]. The summoned creature appears in an unoccupied space within 60 feet of its summoner, acts as an ally of its summoner, and can\'t summon other creatures. It remains for 1 minute, until it or its summoner dies, or until its summoner dismisses it as an action.' },
        { title: 'Swallow', text: 'The creature makes one bite attack against a Medium or smaller target it is grappling. If the attack hits, the target is also swallowed, and the grapple ends. While swallowed, the target is blinded and restrained, it has total cover against attacks and other effects outside the creature, and it takes 21 (6d6) acid damage at the start of each of the creature\'s turns. The creature can have only one target swallowed at a time. If the creature takes 30 damage or more on a single turn from the swallowed creature, the creature must succeed on a DC 15 Constitution saving throw at the end of that turn or regurgitate the creature, which falls prone in a space within 10 feet of the creature. If the creature dies, a swallowed creature is no longer restrained by it and can escape from the corpse by using 15 feet of movement, exiting prone.' },
        { title: 'Teleport', text: 'The creature magically teleports, along with any equipment it is wearing or carrying, up to 120 feet to an unoccupied space it can see.' },
        { title: 'Thunder Clap', text: 'The creature creates a thunderclap audible 300 feet away. Each creature within 10 feet of it must succeed on a DC [DC] Constitution saving throw or take 14 (4d6) thunder damage and be deafened until the end of its next turn.' },
        { title: 'Web', text: 'Ranged Weapon Attack: +5 to hit, range 30/60 ft., one creature. Hit: The target is restrained by webbing. As an action, the restrained target can make a DC 12 Strength check, bursting the webbing on a success. The webbing can also be attacked and destroyed (AC 10; hp 5; vulnerability to fire damage; immunity to bludgeoning, poison, and psychic damage).' },
        // Spells
        { title: 'Banishment', text: 'The creature attempts to send a creature it can see within 60 feet to another plane of existence. The target must succeed on a DC [DC] Charisma saving throw or be banished. If the target is native to a different plane, it is banished to its home plane. Otherwise, the target is banished to a harmless demiplane until the spell ends.' },
        { title: 'Cone of Cold', text: 'The creature casts cone of cold (spell save DC [DC]). A blast of cold air erupts from its hands in a 60-foot cone. Each creature in the area must make a DC [DC] Constitution saving throw, taking 36 (8d8) cold damage on a failed save, or half as much on a success.' },
        { title: 'Counterspell', text: 'The creature attempts to interrupt a creature in the process of casting a spell within 60 feet. If the spell is 3rd level or lower, it automatically fails. If it is 4th level or higher, the creature makes a spellcasting ability check (DC = 10 + the spell\'s level). On a success, the spell fails.' },
        { title: 'Darkness', text: 'The creature casts darkness. Magical darkness spreads from a point within 60 feet, filling a 15-foot-radius sphere until dispelled. Creatures with darkvision cannot see through it, and no nonmagical light can illuminate it.' },
        { title: 'Dimension Door', text: 'The creature teleports up to 500 feet to a location it can visualize or see. It can bring along one willing Medium or smaller creature within 5 feet.' },
        { title: 'Disintegrate', text: 'The creature fires a thin green ray at a target within 60 feet. The target must make a DC [DC] Dexterity saving throw. On a failed save, the target takes 75 (10d6 + 40) force damage. If this damage reduces the target to 0 hit points, it is disintegrated.' },
        { title: 'Dominate Monster', text: 'The creature casts dominate monster. One creature it can see within 60 feet must succeed on a DC [DC] Wisdom saving throw or be charmed by the creature for 1 hour. The charmed target obeys the creature\'s verbal or telepathic commands.' },
        { title: 'Finger of Death', text: 'The creature casts finger of death. A target within 60 feet must make a DC [DC] Constitution saving throw, taking 61 (7d8 + 30) necrotic damage on a failed save, or half as much on a success. A humanoid killed by this spell rises at the start of the creature\'s next turn as a zombie permanently under the creature\'s control.' },
        { title: 'Fireball', text: 'The creature casts fireball (spell save DC [DC]). A bright streak flashes from its pointing finger to a point it chooses within 150 feet, then blossoms into an explosion of flame. Each creature in a 20-foot-radius sphere centered on that point must make a DC [DC] Dexterity saving throw, taking 28 (8d6) fire damage on a failed save, or half as much on a success.' },
        { title: 'Flesh to Stone', text: 'The creature fixes its gaze on a creature it can see within 60 feet. The target must make three DC [DC] Constitution saving throws. If it fails all three, it is petrified permanently.' },
        { title: 'Heal', text: 'The creature restores up to 70 hit points to a creature it touches, ending blindness, deafness, and any diseases on the target.' },
        { title: 'Hold Monster', text: 'The creature casts hold monster (spell save DC [DC]). A creature it can see within 90 feet must succeed on a DC [DC] Wisdom saving throw or be paralyzed for 1 minute. The target can repeat the saving throw at the end of each of its turns, ending the effect on a success.' },
        { title: 'Hold Person', text: 'The creature casts hold person (spell save DC [DC]). A humanoid it can see within 60 feet must succeed on a DC [DC] Wisdom saving throw or be paralyzed for 1 minute. The target can repeat the saving throw at the end of each of its turns, ending the effect on a success.' },
        { title: 'Ice Storm', text: 'The creature casts ice storm (spell save DC [DC]). Hail rains down in a 20-foot-radius, 40-foot-high cylinder centered on a point within 300 feet. Each creature in the area must make a DC [DC] Dexterity saving throw, taking 14 (4d6) bludgeoning and 14 (4d6) cold damage on a failed save, or half as much on a success.' },
        { title: 'Lightning Bolt', text: 'The creature casts lightning bolt (spell save DC [DC]). A stroke of lightning forming a line 100 feet long and 5 feet wide blasts out. Each creature in the line must make a DC [DC] Dexterity saving throw, taking 28 (8d6) lightning damage on a failed save, or half as much on a success.' },
        { title: 'Meteor Swarm', text: 'The creature casts meteor swarm. Blazing orbs of fire plummet to the ground at four points the creature can see within 1 mile. Each creature in a 40-foot-radius sphere centered on each point must make a DC [DC] Dexterity saving throw, taking 20d6 fire and 20d6 bludgeoning damage on a failed save, or half as much on a success.' },
        { title: 'Misty Step', text: 'The creature teleports up to 30 feet to an unoccupied space it can see.' },
        { title: 'Polymorph', text: 'The creature transforms a creature it can see within 60 feet into a new form. An unwilling creature must make a DC [DC] Wisdom saving throw to resist. The creature is transformed into a beast with a challenge rating equal to or less than the target\'s. The target\'s game statistics are replaced by those of the new form.' },
        { title: 'Power Word Kill', text: 'The creature utters a word of power that compels one creature it can see within 60 feet to die instantly. If the target has 100 hit points or fewer, it dies. Otherwise, the spell has no effect.' },
        { title: 'Power Word Stun', text: 'The creature overwhelms the mind of one creature it can see within 60 feet. If the target has 150 hit points or fewer, it is stunned. While stunned, the target must make a DC [DC] Constitution saving throw at the end of each of its turns. On a successful save, the stunning effect ends.' },
        { title: 'Wall of Fire', text: 'The creature creates a wall of fire up to 60 feet long, 20 feet high, and 1 foot thick (or a ringed wall up to 20 feet in diameter) at a point within 120 feet. One side deals 22 (5d8) fire damage to each creature that ends its turn within 10 feet of it or inside it.' },
        { title: 'Wall of Ice', text: 'The creature creates a wall of ice up to 30 feet long, 30 feet high, and 1 foot thick at a point within 120 feet. Each creature in the wall\'s space must make a DC [DC] Dexterity saving throw, taking 10d6 cold damage on a failed save, or half as much on a success.' }
    ],
    reactions: [
        { title: 'Absorb Elements', text: 'When the creature takes acid, cold, fire, lightning, or thunder damage, the creature uses its reaction to absorb some of that energy. Until the end of its next turn, the creature has resistance to the triggering damage type.' },
        { title: 'Brace', text: "When a creature moves into the reach of the creature's polearm or spear, the creature can use its reaction to make one attack against that creature with its weapon." },
        { title: 'Counterattack', text: 'When a creature hits the creature with a melee attack, the creature can make one melee attack against that creature.' },
        { title: 'Deflect Missile', text: 'In response to being hit by a ranged weapon attack, the creature deflects the missile. The damage it takes from the attack is reduced by 1d10 + [DEX modifier]. If the damage is reduced to 0, the creature catches the missile if it\'s small enough to hold in one hand and the creature has a hand free.' },
        { title: 'Dissolve (On Death)', text: 'When the creature dies, it dissolves into [SUBSTANCE]. Any creature within 5 feet of it must succeed on a DC [DC] Dexterity saving throw or take [DICE] [damage type] damage.' },
        { title: 'Evasive Maneuver', text: "In response to being hit by a ranged attack, the creature can use its reaction to move up to half its speed without provoking opportunity attacks." },
        { title: 'Hellish Rebuke', text: 'In response to being damaged by a creature within 60 feet that it can see, the creature points its finger and the creature that damaged it is momentarily surrounded by hellish flames. The creature must make a DC [DC] Dexterity saving throw, taking 11 (2d10) fire damage on a failed save, or half as much on a successful one.' },
        { title: 'Interpose', text: 'When a creature within 5 feet of the creature is targeted by an attack, the creature can use its reaction to become the target of the attack instead.' },
        { title: 'Mark', text: "When a creature the creature can see makes an attack against a target other than the creature, the creature can use its reaction to mark that creature. Until the end of the creature's next turn, the creature has advantage on attack rolls against the marked creature." },
        { title: 'Misty Step', text: 'In response to taking damage, the creature teleports up to 30 feet to an unoccupied space it can see.' },
        { title: 'Negate Spell (Recharge 5–6)', text: "When a spell of 3rd level or lower is cast within 60 feet of the creature, the creature uses its reaction to interrupt the spell. The spell fails and has no effect. If the spell is 4th level or higher, the creature makes an ability check using its spellcasting ability (DC = 10 + the spell's level). On a success, the spell fails." },
        { title: 'Parry', text: 'The creature adds 3 to its AC against one melee attack that would hit it. To do so, the creature must see the attacker and be wielding a melee weapon.' },
        { title: 'Protective Intervention', text: 'When an ally the creature can see within 30 feet of it fails a saving throw, the creature can use its reaction to grant that ally a reroll, which it must use.' },
        { title: 'Redirect Attack', text: 'When a creature misses the creature with a melee attack, the creature can use its reaction to cause that attack to hit one creature of its choice, other than the attacker, that it can see within 5 feet of it.' },
        { title: 'Reformation', text: 'When the creature is reduced to 0 hit points and [CONDITION is not met], it reforms at [LOCATION] with [DICE] hit points after [TIME].' },
        { title: 'Shield', text: 'When a creature the creature can see attacks a target other than the creature that is within 5 feet of the creature, the creature can use its reaction to impose disadvantage on the attack roll. The creature must be wielding a shield.' },
        { title: 'Shield (Spell)', text: 'When the creature is hit by an attack, it creates an invisible barrier of magical force. Until the start of its next turn, it has a +5 bonus to AC, and it takes no damage from magic missile.' },
        { title: 'Shriek', text: 'When the creature takes damage or a creature within 30 feet of it moves into its blindsight range, the creature emits a horrifying shriek audible within 300 feet. Any creature within 60 feet of the creature that can hear it must succeed on a DC [DC] Wisdom saving throw or be frightened until the end of its next turn.' },
        { title: 'Split', text: 'When the creature takes slashing damage, it splits into two new creatures if it has at least 10 hit points. Each new creature has hit points equal to half the original creature\'s, rounded down. New creatures are otherwise identical to the original.' },
        { title: 'Tail Swipe', text: 'When a creature the creature can see attacks it from behind, the creature uses its reaction to make a tail attack against that creature.' },
        { title: 'Uncanny Dodge', text: 'When an attacker the creature can see hits it with an attack, the creature can use its reaction to halve the attack\'s damage against it.' },
        { title: 'Vengeful Strike', text: 'When a creature within 5 feet of the creature hits it with a melee attack, the creature can use its reaction to make one melee weapon attack against that creature.' }
    ],
    legendaryActions: [
        // 1 action cost
        { title: 'At-Will Spell', text: 'The creature casts one of its at-will spells.' },
        { title: 'Bite Attack', text: 'The creature makes a bite attack.' },
        { title: 'Cantrip', text: 'The creature casts a cantrip.' },
        { title: 'Claw Attack', text: 'The creature makes a claw attack.' },
        { title: 'Detect', text: 'The creature makes a Wisdom (Perception) check.' },
        { title: 'Frightful Presence', text: 'The creature uses its Frightful Presence.' },
        { title: 'Move', text: 'The creature moves up to its speed without provoking opportunity attacks.' },
        { title: 'Stomp', text: 'The creature makes one stomp attack.' },
        { title: 'Tail Attack', text: 'The creature makes a tail attack.' },
        { title: 'Weapon Attack', text: 'The creature makes one weapon attack.' },
        // 2 action cost
        { title: 'Blindness (Costs 2 Actions)', text: 'The creature targets one creature it can see within 30 feet. The target must succeed on a DC [DC] Constitution saving throw or be blinded until the end of its next turn.' },
        { title: 'Charge (Costs 2 Actions)', text: 'The creature moves up to its speed, then makes one melee weapon attack.' },
        { title: 'Darkness (Costs 2 Actions)', text: 'The creature magically creates an area of magical darkness in a 15-foot-radius sphere centered on a point it can see within 60 feet. The darkness spreads around corners and lasts for 1 minute.' },
        { title: 'Frightening Gaze (Costs 2 Actions)', text: 'The creature fixes its gaze on one creature it can see within 30 feet. The target must succeed on a DC [DC] Wisdom saving throw or become frightened for 1 minute. A frightened target can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success.' },
        { title: 'Healing Touch (Costs 2 Actions)', text: 'The creature magically regains [DICE] hit points.' },
        { title: 'Life Drain (Costs 2 Actions)', text: 'The creature targets one creature it can see within 20 feet. The target must make a DC [DC] Constitution saving throw, taking [DICE] necrotic damage on a failed save, or half as much on a successful one.' },
        { title: 'Psychic Drain (Costs 2 Actions)', text: 'One creature the creature can see within 10 feet of it must succeed on a DC [DC] Intelligence saving throw or take 32 (5d10 + [INT mod]) psychic damage, and the creature regains hit points equal to the damage dealt.' },
        { title: 'Tail Swipe (Costs 2 Actions)', text: 'The creature swings its tail. Each creature within 10 feet of the creature must succeed on a DC [DC] Dexterity saving throw or take 15 (2d10 + [STR mod]) bludgeoning damage and be knocked prone.' },
        { title: 'Teleport (Costs 2 Actions)', text: 'The creature magically teleports, along with any equipment it is wearing or carrying, up to 120 feet to an unoccupied space it can see.' },
        { title: 'Wing Attack (Costs 2 Actions)', text: 'The creature beats its wings. Each creature within 10 feet of the creature must succeed on a DC [DC] Dexterity saving throw or take 15 (2d6 + [STR mod]) bludgeoning damage and be knocked prone. The creature can then fly up to half its flying speed.' },
        // 3 action cost
        { title: 'Cast a Spell (Costs 3 Actions)', text: 'The creature uses its Spellcasting action to cast a spell of 3rd level or lower.' },
        { title: 'Disrupt Life (Costs 3 Actions)', text: 'Each non-undead creature within 20 feet of the creature must make a DC [DC] Constitution saving throw against this magic, taking 21 (6d6) necrotic damage on a failed save, or half as much damage on a successful one.' },
        { title: 'Summon (Costs 3 Actions)', text: 'The creature magically summons [NUMBER] [CREATURE TYPE] creatures. They appear in unoccupied spaces within 60 feet and act as allies. They remain for 1 minute or until the creature uses this action again.' },
        { title: 'Summon Undead (Costs 3 Actions)', text: 'The creature magically summons [NUMBER] undead creatures. The summoned creatures appear in unoccupied spaces within 60 feet of the creature and act as its allies. They remain until destroyed or until the creature uses this action again.' }
    ]
};

const SECTION_TITLE_SUGGESTIONS: Record<SectionKey, readonly string[]> = (Object.fromEntries(
    (Object.entries(SECTION_SUGGESTIONS) as [SectionKey, readonly SectionSuggestion[]][]).map(([key, suggestions]) => [key, suggestions.map((s) => s.title)])
) as unknown) as Record<SectionKey, readonly string[]>;

const normalizedCatalog = monsterCatalog.map((entry) => normalizeEntry(entry));

function normalizeEntry(entry: MonsterCatalogEntry): MonsterCatalogEntry {
    const name = entry.name?.trim();
    const slug = entry.slug?.trim();
    return {
        ...entry,
        name: name || (slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Unknown'),
        creatureCategory: entry.creatureCategory?.trim() || 'Other'
    };
}

@Component({
    selector: 'app-monster-editor-page',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule, DropdownComponent],
    templateUrl: './monster-editor-page.component.html',
    styleUrl: './monster-editor-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MonsterEditorPageComponent {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly host = inject(ElementRef<HTMLElement>);

    readonly isEditMode = signal(false);
    readonly monsterId = signal<string | null>(null);
    readonly isSaving = signal(false);
    readonly saveError = signal('');
    readonly showUnsavedWarning = signal(false);
    readonly confirmDiscardTarget = signal('');

    readonly templateSearch = signal('');
    readonly templatePickerOpen = signal(false);
    readonly activeTitleSuggestions = signal<{ section: SectionKey; index: number } | null>(null);

    readonly draft = signal<CustomMonster>(createBlankCustomMonster());

    readonly sizeOptions = SIZE_OPTIONS;
    readonly categoryOptions = CATEGORY_OPTIONS;

    readonly templateResults = computed(() => {
        const query = this.templateSearch().trim().toLowerCase();
        if (!query) {
            return normalizedCatalog.slice(0, 30);
        }

        return normalizedCatalog
            .filter((entry) => [entry.name, entry.challengeRating, entry.creatureType, entry.creatureCategory]
                .join(' ')
                .toLowerCase()
                .includes(query))
            .slice(0, 40);
    });

    readonly pageTitle = computed(() => this.isEditMode() ? `Edit: ${this.draft().name || 'Monster'}` : 'New Monster');
    readonly saveLabel = computed(() => this.isSaving() ? 'Saving…' : this.isEditMode() ? 'Save Changes' : 'Save Monster');

    constructor() {
        this.route.paramMap
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((params) => {
                const id = params.get('monsterId');
                this.monsterId.set(id);
                this.isEditMode.set(!!id);

                if (id) {
                    const library = loadMonsterLibrary() ?? [];
                    const found = library.find((m) => m.id === id);
                    if (found) {
                        this.draft.set(sanitizeCustomMonster(found));
                    } else {
                        void this.router.navigate(['/monsters']);
                    }
                } else {
                    this.draft.set(createBlankCustomMonster());
                }

                this.cdr.detectChanges();
            });

        this.route.queryParamMap
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((params) => {
                const templateSlug = params.get('template');
                if (templateSlug && !this.isEditMode()) {
                    const template = normalizedCatalog.find((entry) => entry.slug === templateSlug);
                    if (template) {
                        this.draft.set(createCustomMonsterFromTemplate(template));
                        this.templatePickerOpen.set(false);
                    }
                }

                this.cdr.detectChanges();
            });
    }

    applyTemplate(template: MonsterCatalogEntry): void {
        this.draft.set(createCustomMonsterFromTemplate(template));
        this.templatePickerOpen.set(false);
        this.templateSearch.set('');
        this.cdr.detectChanges();
    }

    clearTemplate(): void {
        this.draft.update((d) => ({
            ...createBlankCustomMonster(),
            id: d.id,
            updatedAt: d.updatedAt
        }));
        this.cdr.detectChanges();
    }

    openTemplatePicker(): void {
        this.templatePickerOpen.set(true);
        this.templateSearch.set('');
        this.cdr.detectChanges();
    }

    closeTemplatePicker(): void {
        this.templatePickerOpen.set(false);
        this.cdr.detectChanges();
    }

    // Draft field updaters
    updateField(field: keyof CustomMonster, value: unknown): void {
        this.draft.update((d) => ({ ...d, [field]: value }));
    }

    updateAbilityScore(stat: keyof CustomMonster['abilityScores'], raw: string): void {
        const value = raw === '' ? null : Number(raw);
        this.draft.update((d) => ({
            ...d,
            abilityScores: { ...d.abilityScores, [stat]: isNaN(value as number) ? null : value }
        }));
    }

    updateNumericField(field: 'armorClass' | 'hitPoints', raw: string): void {
        const value = raw === '' ? null : Number(raw);
        this.draft.update((d) => ({ ...d, [field]: isNaN(value as number) ? null : value }));
    }

    // Text sections: traits, actions, reactions, legendaryActions
    addSection(section: SectionKey): void {
        this.draft.update((d) => ({
            ...d,
            [section]: [...d[section], { title: '', text: '' }]
        }));
    }

    removeSection(section: SectionKey, index: number): void {
        this.draft.update((d) => ({
            ...d,
            [section]: d[section].filter((_, i) => i !== index)
        }));
    }

    private getSectionDefaultText(section: SectionKey, title: string): string | null {
        const match = SECTION_SUGGESTIONS[section].find(
            (s) => s.title.toLowerCase() === title.toLowerCase()
        );
        return match?.text ?? null;
    }

    updateSectionTitle(section: SectionKey, index: number, value: string): void {
        const defaultText = this.getSectionDefaultText(section, value);
        this.draft.update((d) => {
            const updated = [...d[section]];
            const current = updated[index];
            updated[index] = {
                ...current,
                title: value,
                text: defaultText !== null && !current.text.trim() ? defaultText : current.text
            };
            return { ...d, [section]: updated };
        });
    }

    updateSectionText(section: SectionKey, index: number, value: string): void {
        this.draft.update((d) => {
            const updated = [...d[section]];
            updated[index] = { ...updated[index], text: value };
            return { ...d, [section]: updated };
        });
    }

    moveSectionUp(section: SectionKey, index: number): void {
        if (index === 0) {
            return;
        }

        this.draft.update((d) => {
            const arr = [...d[section]];
            [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
            return { ...d, [section]: arr };
        });
    }

    moveSectionDown(section: SectionKey, index: number): void {
        this.draft.update((d) => {
            if (index >= d[section].length - 1) {
                return d;
            }

            const arr = [...d[section]];
            [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
            return { ...d, [section]: arr };
        });
    }

    onSectionTitleInputChanged(section: SectionKey, index: number, value: string): void {
        this.updateSectionTitle(section, index, value);
        this.activeTitleSuggestions.set({ section, index });
    }

    openTitleSuggestions(section: SectionKey, index: number): void {
        this.activeTitleSuggestions.set({ section, index });
    }

    toggleTitleSuggestions(section: SectionKey, index: number): void {
        const current = this.activeTitleSuggestions();
        if (current?.section === section && current.index === index) {
            this.activeTitleSuggestions.set(null);
            return;
        }

        this.activeTitleSuggestions.set({ section, index });
    }

    isTitleSuggestionsOpen(section: SectionKey, index: number): boolean {
        const current = this.activeTitleSuggestions();
        return current?.section === section && current.index === index;
    }

    getTitleSuggestions(section: SectionKey, query: string): readonly string[] {
        const normalized = query.trim().toLowerCase();
        const options = SECTION_TITLE_SUGGESTIONS[section];
        if (!normalized) {
            return options.slice(0, 16);
        }

        return options
            .filter((option) => option.toLowerCase().includes(normalized))
            .sort((a, b) => {
                const aStarts = a.toLowerCase().startsWith(normalized) ? 0 : 1;
                const bStarts = b.toLowerCase().startsWith(normalized) ? 0 : 1;
                return aStarts - bStarts || a.localeCompare(b);
            })
            .slice(0, 16);
    }

    getSectionOptions(section: SectionKey): DropdownOption[] {
        return SECTION_SUGGESTIONS[section].map((s) => ({ value: s.title, label: s.title }));
    }

    pickTitleSuggestion(section: SectionKey, index: number, value: string): void {
        this.updateSectionTitle(section, index, value);
        this.activeTitleSuggestions.set(null);
    }

    @HostListener('document:pointerdown', ['$event'])
    handleDocumentPointerDown(event: PointerEvent): void {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
            return;
        }

        if (!target.closest('.text-entry-title-wrap') && this.host.nativeElement.contains(target)) {
            this.activeTitleSuggestions.set(null);
        }

        if (!this.host.nativeElement.contains(target)) {
            this.activeTitleSuggestions.set(null);
        }
    }

    save(): void {
        const current = this.draft();
        if (!current.name.trim()) {
            this.saveError.set('A name is required.');
            this.cdr.detectChanges();
            return;
        }

        this.isSaving.set(true);
        this.saveError.set('');

        const sanitized = sanitizeCustomMonster(touchCustomMonster(current));
        const library = loadMonsterLibrary() ?? [];

        const existingIndex = library.findIndex((m) => m.id === sanitized.id);
        let updated: CustomMonster[];

        if (existingIndex >= 0) {
            updated = [...library];
            updated[existingIndex] = sanitized;
        } else {
            updated = [sanitized, ...library];
        }

        saveMonsterLibrary(updated);
        this.draft.set(sanitized);
        this.isSaving.set(false);
        this.cdr.detectChanges();

        void this.router.navigate(['/monsters']);
    }

    cancel(): void {
        void this.router.navigate(['/monsters']);
    }

    trackEntry(index: number): number {
        return index;
    }

    modifierText(value: number | null): string {
        if (value == null) {
            return '';
        }

        const modifier = Math.floor((value - 10) / 2);
        return modifier >= 0 ? `(+${modifier})` : `(${modifier})`;
    }
}

type SectionKey = 'traits' | 'actions' | 'reactions' | 'legendaryActions';
