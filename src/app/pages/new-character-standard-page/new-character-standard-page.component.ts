import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs/operators';

import { DungeonStoreService } from '../../state/dungeon-store.service';

type StandardStep = 'home' | 'class' | 'background' | 'species' | 'abilities' | 'equipment' | 'whats-next';
type InfoModalType = 'class' | 'species';
type AbilityGenerationMethod = '' | 'standard-array' | 'manual-rolled' | 'point-buy';

interface BuilderInfo {
    name: string;
    source: string;
    summary: string;
    highlights: string[];
    speciesDetails?: SpeciesDetail;
    details?: {
        tagline: string;
        primaryAbility: string;
        hitPointDie: string;
        saves: string;
        levelOneGains: string[];
        coreTraits: Array<{ label: string; value: string }>;
        levelMilestones: Array<{ title: string; summary: string; details: string }>;
        featureNotes: Array<{ title: string; summary: string; details: string }>;
    };
}

interface ActiveInfoModal {
    type: InfoModalType;
    info: BuilderInfo;
}

interface BackgroundChoice {
    key: string;
    title: string;
    subtitle: string;
    description?: string;
    options: string[];
}

interface BackgroundDetail {
    description: string;
    skillProficiencies: string;
    toolProficiencies: string;
    languages: string;
    choices: BackgroundChoice[];
    sourceUrl: string;
}

interface SpeciesDetail {
    tagline: string;
    creatureType: string;
    size: string;
    speed: string;
    sourceUrl: string;
    coreTraits: Array<{ label: string; value: string }>;
    traitNotes: Array<{ title: string; summary: string; details: string }>;
}

interface EquipmentSource {
    label: string;
    url: string;
    category: string;
}

interface EquipmentItem {
    name: string;
    category: string;
    sourceUrl: string;
}

interface InventoryEntry {
    name: string;
    category: string;
    quantity: number;
    sourceUrl?: string;
}

interface CurrencyState {
    pp: number;
    gp: number;
    ep: number;
    sp: number;
    cp: number;
}

interface ClassFeature {
    name: string;
    level: number;
    description?: string;
    choices?: {
        title: string;
        count: number;
        options: string[];
    };
}

interface ClassFeaturesForLevel {
    level: number;
    features: ClassFeature[];
}

const equipmentSourceLinks: ReadonlyArray<EquipmentSource> = [
    { label: 'Weapons', url: 'https://dnd5e.wikidot.com/weapons', category: 'Weapons' },
    { label: 'Adventuring Gear', url: 'https://dnd5e.wikidot.com/adventuring-gear', category: 'Adventuring Gear' },
    { label: 'Armor', url: 'https://dnd5e.wikidot.com/armor', category: 'Armor' },
    { label: 'Trinkets', url: 'https://dnd5e.wikidot.com/trinkets', category: 'Trinkets' },
    { label: 'Firearms', url: 'https://dnd5e.wikidot.com/firearms', category: 'Firearms' },
    { label: 'Explosives', url: 'https://dnd5e.wikidot.com/explosives', category: 'Explosives' },
    { label: 'Wondrous Items', url: 'https://dnd5e.wikidot.com/wondrous-items', category: 'Wondrous Item' },
    { label: 'Poisons', url: 'https://dnd5e.wikidot.com/poisons', category: 'Poison' },
    { label: 'Tools', url: 'https://dnd5e.wikidot.com/tools', category: 'Tools' },
    { label: 'Siege Equipment', url: 'https://dnd5e.wikidot.com/siege-equipment', category: 'Siege Equipment' }
];

const equipmentCatalog: ReadonlyArray<EquipmentItem> = [
    { name: 'Club', category: 'Weapon', sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
    { name: 'Dagger', category: 'Weapon', sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
    { name: 'Greatclub', category: 'Weapon', sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
    { name: 'Handaxe', category: 'Weapon', sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
    { name: 'Javelin', category: 'Weapon', sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
    { name: 'Light Hammer', category: 'Weapon', sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
    { name: 'Mace', category: 'Weapon', sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
    { name: 'Quarterstaff', category: 'Weapon', sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
    { name: 'Sickle', category: 'Weapon', sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
    { name: 'Spear', category: 'Weapon', sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
    { name: 'Crossbow, Light', category: 'Weapon', sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
    { name: 'Shortbow', category: 'Weapon', sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
    { name: 'Longbow', category: 'Weapon', sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
    { name: 'Longsword', category: 'Weapon', sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
    { name: 'Greatsword', category: 'Weapon', sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
    { name: 'Warhammer', category: 'Weapon', sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
    { name: 'Rapier', category: 'Weapon', sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
    { name: 'Scimitar', category: 'Weapon', sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
    { name: 'Padded Armor', category: 'Armor', sourceUrl: 'https://dnd5e.wikidot.com/armor' },
    { name: 'Leather Armor', category: 'Armor', sourceUrl: 'https://dnd5e.wikidot.com/armor' },
    { name: 'Studded Leather Armor', category: 'Armor', sourceUrl: 'https://dnd5e.wikidot.com/armor' },
    { name: 'Chain Shirt', category: 'Armor', sourceUrl: 'https://dnd5e.wikidot.com/armor' },
    { name: 'Scale Mail', category: 'Armor', sourceUrl: 'https://dnd5e.wikidot.com/armor' },
    { name: 'Breastplate', category: 'Armor', sourceUrl: 'https://dnd5e.wikidot.com/armor' },
    { name: 'Half Plate', category: 'Armor', sourceUrl: 'https://dnd5e.wikidot.com/armor' },
    { name: 'Chain Mail', category: 'Armor', sourceUrl: 'https://dnd5e.wikidot.com/armor' },
    { name: 'Splint Armor', category: 'Armor', sourceUrl: 'https://dnd5e.wikidot.com/armor' },
    { name: 'Plate Armor', category: 'Armor', sourceUrl: 'https://dnd5e.wikidot.com/armor' },
    { name: 'Shield', category: 'Armor', sourceUrl: 'https://dnd5e.wikidot.com/armor' },
    { name: 'Abacus', category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
    { name: 'Acid (Vial)', category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
    { name: "Alchemist's Fire (Flask)", category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
    { name: 'Backpack', category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
    { name: 'Bedroll', category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
    { name: 'Caltrops (Bag of 20)', category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
    { name: 'Crowbar', category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
    { name: "Explorer's Pack", category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
    { name: 'Grappling Hook', category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
    { name: "Healer's Kit", category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
    { name: 'Lantern, Hooded', category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
    { name: 'Rations (1 day)', category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
    { name: 'Rope, Hempen (50 feet)', category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
    { name: 'Torch', category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
    { name: 'Waterskin', category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
    { name: 'Trinket (Random)', category: 'Trinket', sourceUrl: 'https://dnd5e.wikidot.com/trinkets' },
    { name: 'Rabbit Foot Charm', category: 'Trinket', sourceUrl: 'https://dnd5e.wikidot.com/trinkets' },
    { name: 'Old Rusty Key', category: 'Trinket', sourceUrl: 'https://dnd5e.wikidot.com/trinkets' },
    { name: 'Tiny Box with a Button', category: 'Trinket', sourceUrl: 'https://dnd5e.wikidot.com/trinkets' },
    { name: 'Azurite (10 gp)', category: 'Gemstone', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
    { name: 'Obsidian (10 gp)', category: 'Gemstone', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
    { name: 'Bloodstone (50 gp)', category: 'Gemstone', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
    { name: 'Jasper (50 gp)', category: 'Gemstone', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
    { name: 'Amber (100 gp)', category: 'Gemstone', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
    { name: 'Pearl (100 gp)', category: 'Gemstone', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
    { name: 'Black Opal (1000 gp)', category: 'Gemstone', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
    { name: 'Blue Sapphire (1000 gp)', category: 'Gemstone', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
    { name: 'Diamond (5000 gp)', category: 'Gemstone', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
    { name: 'Ruby (5000 gp)', category: 'Gemstone', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
    { name: 'Amulet', category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
    { name: 'Spellbook', category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
    { name: 'Holy Water (Flask)', category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
    { name: 'Fishing Tackle', category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
    { name: 'Hunting Trap', category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
    { name: 'Portable Ram', category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
    { name: 'Mess Kit', category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
    { name: 'Miner\'s Pick', category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
    { name: 'Pitons (10)', category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
    { name: 'Whetstone', category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
    { name: 'Iron, 1 lb', category: 'Trade Good', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
    { name: 'Salt, 1 lb', category: 'Trade Good', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
    { name: 'Wheat, 1 lb', category: 'Trade Good', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
    { name: 'Flour, 1 lb', category: 'Trade Good', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
    { name: 'Pistol', category: 'Firearm', sourceUrl: 'https://dnd5e.wikidot.com/firearms' },
    { name: 'Musket', category: 'Firearm', sourceUrl: 'https://dnd5e.wikidot.com/firearms' },
    { name: 'Pepperbox', category: 'Firearm', sourceUrl: 'https://dnd5e.wikidot.com/firearms' },
    { name: 'Blunderbuss', category: 'Firearm', sourceUrl: 'https://dnd5e.wikidot.com/firearms' },
    { name: 'Bomb', category: 'Explosive', sourceUrl: 'https://dnd5e.wikidot.com/explosives' },
    { name: 'Dynamite (Stick)', category: 'Explosive', sourceUrl: 'https://dnd5e.wikidot.com/explosives' },
    { name: 'Fragmentation Grenade', category: 'Explosive', sourceUrl: 'https://dnd5e.wikidot.com/explosives' },
    { name: 'Smoke Grenade', category: 'Explosive', sourceUrl: 'https://dnd5e.wikidot.com/explosives' },
    { name: 'Bead of Nourishment', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Bead of Refreshment', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Boots of False Tracks', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Bottle of Boundless Coffee', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Breathing Bubble', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Candle of the Deep', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: "Charlatan's Die", category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Chest of Preserving', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Cleansing Stone', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Cloak of Billowing', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Cloak of Many Fashions', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Clockwork Amulet', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Clothes of Mending', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Coin of Delving', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Cuddly Strixhaven Mascot', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Dark Shard Amulet', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Dread Helm', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Ear Horn of Hearing', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Earring of Message', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Enduring Spellbook', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Ersatz Eye', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Everbright Lantern', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Feather Token', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Glamerweave', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Hat of Vermin', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Hat of Wizardry', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: "Heward's Handy Spice Pouch", category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Horn of Silent Alarm', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: "Illuminator's Tattoo", category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Imbued Wood Focus', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Instrument of Illusions', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Instrument of Scribing', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Keycharm', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Lantern of Tracking', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Lock of Trickery', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Masque Charm', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Masquerade Tattoo', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Medal of Muscle', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Medal of the Conch', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Medal of the Horizonback', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Medal of the Maze', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Medal of the Meat Pie', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Medal of the Wetlands', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Medal of Wit', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Mind Crystal', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Moodmark Paint', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Mystery Key', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Orb of Direction', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Orb of Gonging', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Orb of Shielding', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Orb of Time', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Perfume of Bewitching', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Pipe of Remembrance', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Pipe of Smoke Monsters', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Pole of Angling', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Pole of Collapsing', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Pot of Awakening', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Pressure Capsule', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Prosthetic Limb', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Rope of Mending', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Ruby of the War Mage', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: "Scribe's Pen", category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Sekolahian Worshipping Statuette', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Shiftweave', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Spellshard', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Spellwrought Tattoo', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Strixhaven Pennant', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Talking Doll', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Tankard of Plenty', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Tankard of Sobriety', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Thermal Cube', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: "Veteran's Cane", category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Vox Seeker', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Wand Sheath', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    // Uncommon Wondrous Items
    { name: 'Bag of Holding', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Bag of Tricks', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Boots of Elvenkind', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Boots of Levitation', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Boots of Striding and Springing', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Boots of the Winterlands', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Bracers of Archery', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Brooch of Shielding', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Broom of Flying', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Circlet of Blasting', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Cloak of Elvinkind', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Cloak of the Manta Ray', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Decanter of Endless Water', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Deck of Illusions', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Dust of Disappearance', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Dust of Dryness', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Dust of Sneezing and Choking', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Elemental Gem', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Eversmoking Bottle', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Eyes of Charming', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Eyes of Minute Seeing', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Eyes of the Eagle', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Gauntlets of Ogre Power', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Gem of Brightness', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Gloves of Missile Snaring', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Gloves of Swimming and Climbing', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Hat of Disguise', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Headband of Intellect', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Helm of Comprehending Languages', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Javelin of Lightning', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Lantern of Revealing', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Medallion of Thoughts', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Mithral Armor', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Necklace of Adaptation', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Pearl of Power', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Periapt of Health', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Periapt of Wound Closure', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Pipes of Haunting', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Pipes of the Sewers', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Potion of Climbing', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Potion of Growth', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Ring of Jumping', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Ring of Mind Shielding', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Ring of Swimming', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Ring of Warmth', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Ring of Water Walking', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Restorative Ointment', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Rope of Climbing', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Slippers of Spider Climbing', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Staff of the Python', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Stone of Good Luck (Luckstone)', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Trident of Fish Command', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Wand of Magic Detection', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Wand of Magic Missiles', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Wand of Secrets', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Wand of Web', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Wind Fan', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Winged Boots', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    // Rare Wondrous Items
    { name: 'Amulet of Health', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Amulet of Proof against Detection and Location', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Amulet of the Planes', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Bag of Beans', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Bead of Force', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Belt of Dwarvenkind', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Belt of Giant Strength (Hill Giant)', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Bowl of Commanding Water Elementals', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Bracers of Defense', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Brazier of Commanding Fire Elementals', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Censer of Controlling Air Elementals', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Chime of Opening', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Cloak of Arachnida', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Cloak of Displacement', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Cloak of Protection', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Cloak of the Bat', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Cube of Force', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Dimensional Shackles', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Dragon Scale Mail', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Efficient Quiver', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Efreeti Bottle', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Figurine of Wondrous Power', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Folding Boat', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Gem of Seeing', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Handy Haversack', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Helm of Telepathy', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Helm of Teleportation', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Horn of Blasting', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Horn of Valhalla (Silver or Brass)', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Horseshoes of Speed', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Instant Fortress', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Ioun Stone', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Iron Bands of Binding', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Mantle of Spell Resistance', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Mirror of Life Trapping', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Necklace of Fireballs', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Necklace of Prayer Beads', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Oil of Etherealness', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Periapt of Proof against Poison', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Ring of Animal Influence', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Ring of Evasion', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Ring of Feather Falling', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Ring of Free Action', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Ring of Invisibility', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Ring of Protection', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Ring of Resistance', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Ring of Shooting Stars', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Ring of Spell Storing', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Ring of Telekinesis', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Ring of the Ram', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Robe of Eyes', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Rod of Alertness', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Rod of Rulership', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Rod of Security', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Rope of Entanglement', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Stone of Controlling Earth Elementals', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Wand of Binding', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Wand of Enemy Detection', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Wand of Fear', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Wand of Fireballs', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Wand of Lightning Bolts', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Wand of Polymorph', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Wand of the War Mage (+1)', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Wand of Wonder', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Wings of Flying', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    // Very Rare Wondrous Items
    { name: 'Animated Shield', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Absorbing Tattoo', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Apparatus of the Crab', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Armor of Invulnerability', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Arrow of Slaying', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Bag of Devouring', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Belt of Giant Strength (Stone/Frost/Fire)', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Candle of Invocation', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Carpet of Flying', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Crystal Ball', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Cubic Gate', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Demon Armor', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Frost Brand', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Helm of Brilliance', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Horseshoes of a Zephyr', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Iron Flask', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Marvelous Pigments', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Nine Lives Stealer', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Oathbow', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Oil of Sharpness', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Plate Armor of Etherealness', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Potion of Flying', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Potion of Invisibility', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Ring of Djinni Summoning', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Ring of Elemental Command', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Ring of Regeneration', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Robe of Scintillating Colors', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Robe of Stars', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Scimitar of Speed', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Sphere of Annihilation', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Staff of Fire', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Staff of Frost', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Staff of Power', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Staff of Swarming Insects', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Staff of Thunder and Lightning', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Wand of the War Mage (+2)', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Well of Many Worlds', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    // Legendary Wondrous Items
    { name: 'Belt of Giant Strength (Cloud/Storm)', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Deck of Many Things', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Defender (Sword)', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Holy Avenger', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Luck Blade', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Manual of Bodily Health', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Manual of Gainful Exercise', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Manual of Golems', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Manual of Quickness of Action', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Ring of Spell Turning', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Ring of Three Wishes', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Robe of the Archmagi', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Rod of Lordly Might', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Scarab of Protection', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Sovereign Glue', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Staff of the Magi', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Talisman of Pure Good', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Talisman of the Sphere', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Talisman of Ultimate Evil', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Universal Solvent', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    // Artifact Items
    { name: 'Orb of Dragonkind', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Hand of Vecna', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Eye of Vecna', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Wand of Orcus', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Wyvern Throne of Asmodeus', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Throne of Bhaal', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Staff of the Spellsteal', category: 'Wondrous Item', sourceUrl: 'https://dnd5e.wikidot.com/wondrous-items' },
    { name: 'Basic Poison (Vial)', category: 'Poison', sourceUrl: 'https://dnd5e.wikidot.com/poisons' },
    { name: "Assassin's Blood", category: 'Poison', sourceUrl: 'https://dnd5e.wikidot.com/poisons' },
    { name: 'Burnt Othur Fumes', category: 'Poison', sourceUrl: 'https://dnd5e.wikidot.com/poisons' },
    { name: 'Crawler Mucus', category: 'Poison', sourceUrl: 'https://dnd5e.wikidot.com/poisons' },
    { name: 'Drow Poison', category: 'Poison', sourceUrl: 'https://dnd5e.wikidot.com/poisons' },
    { name: 'Purple Worm Poison', category: 'Poison', sourceUrl: 'https://dnd5e.wikidot.com/poisons' },
    { name: "Alchemist's Supplies", category: 'Tools', sourceUrl: 'https://dnd5e.wikidot.com/tools' },
    { name: "Brewer's Supplies", category: 'Tools', sourceUrl: 'https://dnd5e.wikidot.com/tools' },
    { name: "Calligrapher's Supplies", category: 'Tools', sourceUrl: 'https://dnd5e.wikidot.com/tools' },
    { name: "Carpenter's Tools", category: 'Tools', sourceUrl: 'https://dnd5e.wikidot.com/tools' },
    { name: "Cook's Utensils", category: 'Tools', sourceUrl: 'https://dnd5e.wikidot.com/tools' },
    { name: 'Disguise Kit', category: 'Tools', sourceUrl: 'https://dnd5e.wikidot.com/tools' },
    { name: 'Forgery Kit', category: 'Tools', sourceUrl: 'https://dnd5e.wikidot.com/tools' },
    { name: 'Herbalism Kit', category: 'Tools', sourceUrl: 'https://dnd5e.wikidot.com/tools' },
    { name: "Navigator's Tools", category: 'Tools', sourceUrl: 'https://dnd5e.wikidot.com/tools' },
    { name: "Poisoner's Kit", category: 'Tools', sourceUrl: 'https://dnd5e.wikidot.com/tools' },
    { name: "Thieves' Tools", category: 'Tools', sourceUrl: 'https://dnd5e.wikidot.com/tools' },
    { name: 'Ballista', category: 'Siege Equipment', sourceUrl: 'https://dnd5e.wikidot.com/siege-equipment' },
    { name: 'Mangonel', category: 'Siege Equipment', sourceUrl: 'https://dnd5e.wikidot.com/siege-equipment' },
    { name: 'Trebuchet', category: 'Siege Equipment', sourceUrl: 'https://dnd5e.wikidot.com/siege-equipment' },
    { name: 'Battering Ram', category: 'Siege Equipment', sourceUrl: 'https://dnd5e.wikidot.com/siege-equipment' },
    { name: 'Siege Tower', category: 'Siege Equipment', sourceUrl: 'https://dnd5e.wikidot.com/siege-equipment' }
];

const classStartingPackages = {
    A: {
        items: [
            { name: 'Greataxe', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
            { name: 'Handaxe', category: 'Weapon', quantity: 4, sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
            { name: "Explorer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
        ],
        currency: { gp: 15 }
    },
    B: {
        items: [],
        currency: { gp: 75 }
    }
} as const;

const backgroundStartingPackages = {
    A: {
        items: [
            { name: "Calligrapher's Supplies", category: 'Tools', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/tools' },
            { name: 'Book (Prayers)', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
            { name: 'Holy Symbol', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
            { name: 'Parchment (10 sheets)', category: 'Adventuring Gear', quantity: 10, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
            { name: 'Robe', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
        ],
        currency: { gp: 8 }
    },
    B: {
        items: [],
        currency: { gp: 50 }
    }
} as const;

const validSteps = new Set<StandardStep>(['home', 'class', 'background', 'species', 'abilities', 'equipment', 'whats-next']);

const classLevelOneFeatures: Record<string, ClassFeaturesForLevel[]> = {
    Barbarian: [
        {
            level: 1, features: [
                {
                    name: 'Core Barbarian Traits',
                    level: 1,
                    description: 'Gain all barbarian proficiencies and hit dice.',
                    choices: {
                        title: 'Choose 2 Skill Proficiencies',
                        count: 2,
                        options: ['Animal Handling', 'Athletics', 'Intimidation', 'Nature', 'Perception', 'Survival']
                    }
                },
                { name: 'Rage', level: 1, description: 'Enter a primal rage 2 times per long rest. You gain advantage on Strength checks/saves and damage resistance while raging.' },
                { name: 'Unarmored Defense', level: 1, description: 'While unarmored, your AC = 10 + Dexterity modifier + Constitution modifier.' }
            ]
        },
        {
            level: 2, features: [
                { name: 'Reckless Attack', level: 2, description: 'Attack with advantage before your allies take their turns. Attacks against you have advantage until your next turn.' },
                { name: 'Danger Sense', level: 2, description: 'Gain advantage on Dexterity saves you can see coming.' }
            ]
        },
        {
            level: 3, features: [
                { name: 'Barbarian Subclass', level: 3, description: 'Choose your Barbarian subclass.' },
                { name: 'Primal Knowledge', level: 3, description: 'Gain primal utility improvements.' }
            ]
        },
        {
            level: 4, features: [
                { name: 'Ability Score Improvement', level: 4, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 5, features: [
                { name: 'Extra Attack', level: 5, description: 'Attack twice when you take the Attack action on your turn.' },
                { name: 'Fast Movement', level: 5, description: 'Your speed increases while not wearing heavy armor.' }
            ]
        },
        {
            level: 6, features: [
                { name: 'Subclass Feature', level: 6, description: 'Gain a feature from your Barbarian subclass.' }
            ]
        },
        {
            level: 7, features: [
                { name: 'Feral Instinct', level: 7, description: 'Improve initiative and awareness in combat.' },
                { name: 'Instinctive Pounce', level: 7, description: 'Move aggressively when entering rage.' }
            ]
        },
        {
            level: 8, features: [
                { name: 'Ability Score Improvement', level: 8, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 9, features: [
                { name: 'Brutal Strike', level: 9, description: 'Your heavy melee pressure scales upward.' }
            ]
        },
        {
            level: 10, features: [
                { name: 'Subclass Feature', level: 10, description: 'Gain a feature from your Barbarian subclass.' }
            ]
        },
        {
            level: 11, features: [
                { name: 'Relentless Rage', level: 11, description: 'You can remain standing after dropping to 0 HP while raging.' }
            ]
        },
        {
            level: 12, features: [
                { name: 'Ability Score Improvement', level: 12, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 13, features: [
                { name: 'Improved Brutal Strike', level: 13, description: 'Your brutal strike options improve.' }
            ]
        },
        {
            level: 14, features: [
                { name: 'Subclass Feature', level: 14, description: 'Gain a feature from your Barbarian subclass.' }
            ]
        },
        {
            level: 15, features: [
                { name: 'Persistent Rage', level: 15, description: 'Your rage becomes harder to end early.' }
            ]
        },
        {
            level: 16, features: [
                { name: 'Ability Score Improvement', level: 16, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 17, features: [
                { name: 'Improved Brutal Strike', level: 17, description: 'Your brutal strike options improve again.' }
            ]
        },
        {
            level: 18, features: [
                { name: 'Indomitable Might', level: 18, description: 'Your physical prowess becomes exceptionally reliable.' }
            ]
        },
        {
            level: 19, features: [
                { name: 'Epic Boon', level: 19, description: 'Gain a powerful epic boon.' }
            ]
        },
        {
            level: 20, features: [
                { name: 'Primal Champion', level: 20, description: 'Reach the Barbarian capstone of primal strength and endurance.' }
            ]
        }
    ],
    'Blood Hunter': [
        {
            level: 1, features: [
                {
                    name: "Hunter's Bane and Blood Maledict",
                    level: 1,
                    description: 'Gain supernatural tracking abilities and blood curses.',
                    choices: {
                        title: 'Choose 2 Skill Proficiencies',
                        count: 2,
                        options: ['Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Insight', 'Investigation', 'Medicine', 'Perception', 'Stealth', 'Survival']
                    }
                },
                { name: 'Blood Maledict', level: 1, description: 'Cast blood curses on enemies you can see. You know 1 curse at 1st level.' },
                { name: 'Crimson Rite', level: 1, description: 'Infuse your weapon with elemental power by spending hit points.' }
            ]
        }
    ],
    Bard: [
        {
            level: 1, features: [
                {
                    name: 'Core Bard Traits',
                    level: 1,
                    description: 'Gain spellcasting and bardic inspiration.',
                    choices: {
                        title: 'Choose 2 Skill Proficiencies from any skill',
                        count: 2,
                        options: ['Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception', 'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine', 'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion', 'Sleight of Hand', 'Stealth', 'Survival']
                    }
                },
                { name: 'Spellcasting', level: 1, description: 'Cast spells using Charisma. Know 4 cantrips and have 2 1st-level spell slots.' },
                { name: 'Bardic Inspiration', level: 1, description: 'Grant allies inspiration dice (d6) they can add to ability checks, attack rolls, or saves.' }
            ]
        },
        {
            level: 2, features: [
                { name: 'Jack of All Trades', level: 2, description: 'Add half your proficiency bonus to ability checks you don\'t already add proficiency to.' }
            ]
        },
        {
            level: 3, features: [
                { name: 'Bard Subclass', level: 3, description: 'Choose your Bard subclass.' }
            ]
        },
        {
            level: 4, features: [
                { name: 'Ability Score Improvement', level: 4, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 5, features: [
                { name: 'Font of Inspiration', level: 5, description: 'Your inspiration engine improves at this tier.' }
            ]
        },
        {
            level: 6, features: [
                { name: 'Subclass Feature', level: 6, description: 'Gain a feature from your Bard subclass.' }
            ]
        },
        {
            level: 7, features: [
                { name: 'Countercharm', level: 7, description: 'Use performance to protect allies from disruptive effects.' }
            ]
        },
        {
            level: 8, features: [
                { name: 'Ability Score Improvement', level: 8, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 9, features: [
                { name: 'Expertise', level: 9, description: 'Broaden your mastery in chosen proficiencies.' }
            ]
        },
        {
            level: 10, features: [
                { name: 'Magical Secrets', level: 10, description: 'Learn spells outside the Bard list.' }
            ]
        },
        {
            level: 12, features: [
                { name: 'Ability Score Improvement', level: 12, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 14, features: [
                { name: 'Subclass Feature', level: 14, description: 'Gain a feature from your Bard subclass.' }
            ]
        },
        {
            level: 16, features: [
                { name: 'Ability Score Improvement', level: 16, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 18, features: [
                { name: 'Superior Inspiration', level: 18, description: 'Your inspiration support reaches late-tier reliability.' }
            ]
        },
        {
            level: 19, features: [
                { name: 'Epic Boon', level: 19, description: 'Gain a powerful epic boon.' }
            ]
        },
        {
            level: 20, features: [
                { name: 'Words of Creation', level: 20, description: 'Gain your Bard capstone feature.' }
            ]
        }
    ],
    Cleric: [
        {
            level: 1, features: [
                {
                    name: 'Core Cleric Traits',
                    level: 1,
                    description: 'Gain divine spellcasting and channel divinity.',
                    choices: {
                        title: 'Choose 2 Skill Proficiencies',
                        count: 2,
                        options: ['Insight', 'Medicine', 'Persuasion', 'Religion']
                    }
                },
                { name: 'Spellcasting', level: 1, description: 'Cast spells using Wisdom.' },
                { name: 'Divine Order', level: 1, description: 'Choose your divine training focus.' }
            ]
        },
        {
            level: 2, features: [
                { name: 'Channel Divinity', level: 2, description: 'Gain Channel Divinity uses and options.' }
            ]
        },
        {
            level: 3, features: [
                { name: 'Cleric Subclass', level: 3, description: 'Choose your Divine Domain subclass.' }
            ]
        },
        {
            level: 4, features: [
                { name: 'Ability Score Improvement', level: 4, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 5, features: [
                { name: 'Sear Undead', level: 5, description: 'Your anti-undead channeling power increases.' }
            ]
        },
        {
            level: 6, features: [
                { name: 'Subclass Feature', level: 6, description: 'Gain a feature from your Cleric subclass.' }
            ]
        },
        {
            level: 7, features: [
                { name: 'Blessed Strikes', level: 7, description: 'Your divine strikes improve your offense.' }
            ]
        },
        {
            level: 8, features: [
                { name: 'Ability Score Improvement', level: 8, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 10, features: [
                { name: 'Divine Intervention', level: 10, description: 'Call directly on divine aid.' }
            ]
        },
        {
            level: 12, features: [
                { name: 'Ability Score Improvement', level: 12, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 14, features: [
                { name: 'Improved Blessed Strikes', level: 14, description: 'Your blessed strikes gain additional power.' }
            ]
        },
        {
            level: 16, features: [
                { name: 'Ability Score Improvement', level: 16, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 17, features: [
                { name: 'Subclass Feature', level: 17, description: 'Gain a feature from your Cleric subclass.' }
            ]
        },
        {
            level: 19, features: [
                { name: 'Epic Boon', level: 19, description: 'Gain a powerful epic boon.' }
            ]
        },
        {
            level: 20, features: [
                { name: 'Greater Divine Intervention', level: 20, description: 'Your divine intervention reaches its capstone power.' }
            ]
        }
    ],
    Druid: [
        {
            level: 1, features: [
                {
                    name: 'Core Druid Traits',
                    level: 1,
                    description: 'Gain nature spellcasting and wild shape capability.',
                    choices: {
                        title: 'Choose 2 Skill Proficiencies',
                        count: 2,
                        options: ['Animal Handling', 'Arcana', 'Insight', 'Medicine', 'Nature', 'Perception', 'Religion', 'Survival']
                    }
                },
                { name: 'Spellcasting', level: 1, description: 'Cast spells using Wisdom.' },
                { name: 'Druidic', level: 1, description: 'Learn the Druidic secret language.' },
                { name: 'Primal Order', level: 1, description: 'Choose your primal training focus.' }
            ]
        },
        {
            level: 2, features: [
                { name: 'Wild Shape', level: 2, description: 'Transform into beasts.' },
                { name: 'Wild Companion', level: 2, description: 'Summon a temporary familiar-like companion.' }
            ]
        },
        {
            level: 3, features: [
                { name: 'Druid Subclass', level: 3, description: 'Choose your Druid Circle.' }
            ]
        },
        {
            level: 4, features: [
                { name: 'Ability Score Improvement', level: 4, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 5, features: [
                { name: 'Wild Resurgence', level: 5, description: 'Improve your wild shape resource cycle.' }
            ]
        },
        {
            level: 6, features: [
                { name: 'Subclass Feature', level: 6, description: 'Gain a feature from your Druid subclass.' }
            ]
        },
        {
            level: 7, features: [
                { name: 'Elemental Fury', level: 7, description: 'Gain stronger elemental output options.' }
            ]
        },
        {
            level: 8, features: [
                { name: 'Ability Score Improvement', level: 8, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 10, features: [
                { name: 'Subclass Feature', level: 10, description: 'Gain a feature from your Druid subclass.' }
            ]
        },
        {
            level: 12, features: [
                { name: 'Ability Score Improvement', level: 12, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 14, features: [
                { name: 'Subclass Feature', level: 14, description: 'Gain a feature from your Druid subclass.' }
            ]
        },
        {
            level: 15, features: [
                { name: 'Improved Elemental Fury', level: 15, description: 'Your elemental fury upgrades in late tiers.' }
            ]
        },
        {
            level: 16, features: [
                { name: 'Ability Score Improvement', level: 16, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 18, features: [
                { name: 'Beast Spells', level: 18, description: 'Cast spells while in beast form.' }
            ]
        },
        {
            level: 19, features: [
                { name: 'Epic Boon', level: 19, description: 'Gain a powerful epic boon.' }
            ]
        },
        {
            level: 20, features: [
                { name: 'Archdruid', level: 20, description: 'Gain your Druid capstone feature.' }
            ]
        }
    ],
    Fighter: [
        {
            level: 1, features: [
                {
                    name: 'Core Fighter Traits',
                    level: 1,
                    description: 'Master martial combat with weapon and armor proficiency.',
                    choices: {
                        title: 'Choose 1 Fighting Style',
                        count: 1,
                        options: ['Archery', 'Defense', 'Dueling', 'Great Weapon Fighting', 'Protection', 'Two-Weapon Fighting', 'Blind Fighting', 'Blessed Warrior', 'Mariner', 'Thrown Weapon Fighting', 'Unarmed Fighting']
                    }
                },
                {
                    name: 'Fighting Style',
                    level: 1,
                    description: 'Gain specific combat bonuses based on your chosen fighting style.'
                },
                { name: 'Second Wind', level: 1, description: 'Recover hit points as a bonus action.' },
                { name: 'Weapon Mastery', level: 1, description: 'Gain mastery options for selected weapons.' }
            ]
        },
        {
            level: 2, features: [
                { name: 'Action Surge (one use)', level: 2, description: 'Take an additional action on your turn.' },
                { name: 'Tactical Mind', level: 2, description: 'Gain tactical combat utility options.' }
            ]
        },
        {
            level: 3, features: [
                { name: 'Fighter Subclass', level: 3, description: 'Choose your Fighter subclass.' }
            ]
        },
        {
            level: 4, features: [
                { name: 'Ability Score Improvement', level: 4, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 5, features: [
                { name: 'Extra Attack', level: 5, description: 'Attack twice when you take the Attack action.' },
                { name: 'Tactical Shift', level: 5, description: 'Gain enhanced battlefield mobility options.' }
            ]
        },
        {
            level: 6, features: [
                { name: 'Ability Score Improvement', level: 6, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 7, features: [
                { name: 'Subclass Feature', level: 7, description: 'Gain a feature from your Fighter subclass.' }
            ]
        },
        {
            level: 8, features: [
                { name: 'Ability Score Improvement', level: 8, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 9, features: [
                { name: 'Indomitable (one use)', level: 9, description: 'Reroll a failed saving throw.' },
                { name: 'Tactical Master', level: 9, description: 'Gain advanced tactical options.' }
            ]
        },
        {
            level: 10, features: [
                { name: 'Subclass Feature', level: 10, description: 'Gain a feature from your Fighter subclass.' }
            ]
        },
        {
            level: 11, features: [
                { name: 'Two Extra Attacks', level: 11, description: 'Attack three times when taking the Attack action.' }
            ]
        },
        {
            level: 12, features: [
                { name: 'Ability Score Improvement', level: 12, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 13, features: [
                { name: 'Indomitable (two uses)', level: 13, description: 'Gain an additional Indomitable use.' },
                { name: 'Studied Attacks', level: 13, description: 'Refine your offensive tactical pressure.' }
            ]
        },
        {
            level: 14, features: [
                { name: 'Ability Score Improvement', level: 14, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 15, features: [
                { name: 'Subclass Feature', level: 15, description: 'Gain a feature from your Fighter subclass.' }
            ]
        },
        {
            level: 16, features: [
                { name: 'Ability Score Improvement', level: 16, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 17, features: [
                { name: 'Action Surge (two uses)', level: 17, description: 'Gain an additional Action Surge use.' },
                { name: 'Indomitable (three uses)', level: 17, description: 'Gain a third Indomitable use.' }
            ]
        },
        {
            level: 18, features: [
                { name: 'Subclass Feature', level: 18, description: 'Gain a feature from your Fighter subclass.' }
            ]
        },
        {
            level: 19, features: [
                { name: 'Epic Boon', level: 19, description: 'Gain a powerful epic boon.' }
            ]
        },
        {
            level: 20, features: [
                { name: 'Three Extra Attacks', level: 20, description: 'Attack four times when taking the Attack action.' }
            ]
        }
    ],
    Monk: [
        {
            level: 1, features: [
                {
                    name: 'Core Monk Traits',
                    level: 1,
                    description: 'Master martial arts with discipline and mobility.',
                    choices: {
                        title: 'Choose 2 Skill Proficiencies',
                        count: 2,
                        options: ['Acrobatics', 'Athletics', 'History', 'Insight', 'Religion', 'Stealth']
                    }
                },
                { name: 'Martial Arts', level: 1, description: 'Use Martial Arts for enhanced unarmed combat.' },
                { name: 'Unarmored Defense', level: 1, description: 'While unarmored, AC = 10 + Wisdom modifier + Dexterity modifier.' }
            ]
        },
        {
            level: 2, features: [
                { name: 'Monk\'s Focus', level: 2, description: 'Gain your core focus resource engine.' },
                { name: 'Unarmored Movement', level: 2, description: 'Your movement speed increases.' },
                { name: 'Uncanny Metabolism', level: 2, description: 'Gain improved endurance through your monk resource cycle.' }
            ]
        },
        {
            level: 3, features: [
                { name: 'Deflect Attacks', level: 3, description: 'Reduce incoming attack damage with monk reactions.' },
                { name: 'Monk Subclass', level: 3, description: 'Choose your Monastic Tradition subclass.' }
            ]
        },
        {
            level: 4, features: [
                { name: 'Ability Score Improvement', level: 4, description: 'Increase your ability scores or take a feat.' },
                { name: 'Slow Fall', level: 4, description: 'Reduce falling damage with disciplined movement.' }
            ]
        },
        {
            level: 5, features: [
                { name: 'Extra Attack', level: 5, description: 'Attack twice when you take the Attack action.' },
                { name: 'Stunning Strike', level: 5, description: 'Attempt to stun enemies with focused strikes.' }
            ]
        },
        {
            level: 6, features: [
                { name: 'Empowered Strikes', level: 6, description: 'Your strikes become empowered for overcoming resistance.' },
                { name: 'Subclass Feature', level: 6, description: 'Gain a feature from your Monk subclass.' }
            ]
        },
        {
            level: 7, features: [
                { name: 'Evasion', level: 7, description: 'Improve survivability against area effects.' }
            ]
        },
        {
            level: 8, features: [
                { name: 'Ability Score Improvement', level: 8, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 9, features: [
                { name: 'Acrobatic Movement', level: 9, description: 'Gain advanced movement options.' }
            ]
        },
        {
            level: 10, features: [
                { name: 'Heightened Focus', level: 10, description: 'Your focus resource utility improves.' },
                { name: 'Self-Restoration', level: 10, description: 'Gain improved self-sustain and recovery.' }
            ]
        },
        {
            level: 11, features: [
                { name: 'Subclass Feature', level: 11, description: 'Gain a feature from your Monk subclass.' }
            ]
        },
        {
            level: 12, features: [
                { name: 'Ability Score Improvement', level: 12, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 13, features: [
                { name: 'Deflect Energy', level: 13, description: 'Expand your deflection techniques against energy effects.' }
            ]
        },
        {
            level: 14, features: [
                { name: 'Disciplined Survivor', level: 14, description: 'Your discipline reinforces key saving throw resilience.' }
            ]
        },
        {
            level: 15, features: [
                { name: 'Perfect Focus', level: 15, description: 'Improve your focus economy in extended adventuring.' }
            ]
        },
        {
            level: 16, features: [
                { name: 'Ability Score Improvement', level: 16, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 17, features: [
                { name: 'Subclass Feature', level: 17, description: 'Gain a feature from your Monk subclass.' }
            ]
        },
        {
            level: 18, features: [
                { name: 'Superior Defense', level: 18, description: 'Reach late-game defensive mastery.' }
            ]
        },
        {
            level: 19, features: [
                { name: 'Epic Boon', level: 19, description: 'Gain a powerful epic boon.' }
            ]
        },
        {
            level: 20, features: [
                { name: 'Body and Mind', level: 20, description: 'Gain your Monk capstone feature.' }
            ]
        }
    ],
    Paladin: [
        {
            level: 1, features: [
                {
                    name: 'Core Paladin Traits',
                    level: 1,
                    description: 'Gain holy warrior training and oath preparation.',
                    choices: {
                        title: 'Choose 2 Skill Proficiencies',
                        count: 2,
                        options: ['Athletics', 'Insight', 'Intimidation', 'Medicine', 'Persuasion', 'Religion']
                    }
                },
                { name: 'Lay On Hands', level: 1, description: 'Restore hit points from your Lay On Hands pool.' },
                { name: 'Spellcasting', level: 1, description: 'Cast spells using Charisma.' },
                { name: 'Weapon Mastery', level: 1, description: 'Gain mastery options for selected weapons.' }
            ]
        },
        {
            level: 2, features: [
                { name: 'Fighting Style', level: 2, description: 'Choose your holy combat style.' },
                { name: 'Paladin\'s Smite', level: 2, description: 'Enhance weapon strikes with divine smites.' }
            ]
        },
        {
            level: 3, features: [
                { name: 'Channel Divinity', level: 3, description: 'Gain sacred channel divinity options.' },
                { name: 'Paladin Subclass', level: 3, description: 'Choose your Sacred Oath subclass.' }
            ]
        },
        {
            level: 4, features: [
                { name: 'Ability Score Improvement', level: 4, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 5, features: [
                { name: 'Extra Attack', level: 5, description: 'Attack twice when taking the Attack action.' },
                { name: 'Faithful Steed', level: 5, description: 'Gain your oath-bound mount support feature.' }
            ]
        },
        {
            level: 6, features: [
                { name: 'Aura of Protection', level: 6, description: 'Project a protective aura to aid nearby allies.' }
            ]
        },
        {
            level: 7, features: [
                { name: 'Subclass Feature', level: 7, description: 'Gain a feature from your Paladin subclass.' }
            ]
        },
        {
            level: 8, features: [
                { name: 'Ability Score Improvement', level: 8, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 9, features: [
                { name: 'Abjure Foes', level: 9, description: 'Gain stronger anti-foe control options.' }
            ]
        },
        {
            level: 10, features: [
                { name: 'Aura of Courage', level: 10, description: 'Bolster allies against fear effects.' }
            ]
        },
        {
            level: 11, features: [
                { name: 'Radiant Strikes', level: 11, description: 'Your strikes carry radiant power.' }
            ]
        },
        {
            level: 12, features: [
                { name: 'Ability Score Improvement', level: 12, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 14, features: [
                { name: 'Restoring Touch', level: 14, description: 'Gain improved restorative support options.' }
            ]
        },
        {
            level: 15, features: [
                { name: 'Subclass Feature', level: 15, description: 'Gain a feature from your Paladin subclass.' }
            ]
        },
        {
            level: 16, features: [
                { name: 'Ability Score Improvement', level: 16, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 18, features: [
                { name: 'Aura Expansion', level: 18, description: 'Your protective aura extends farther.' }
            ]
        },
        {
            level: 19, features: [
                { name: 'Epic Boon', level: 19, description: 'Gain a powerful epic boon.' }
            ]
        },
        {
            level: 20, features: [
                { name: 'Subclass Feature', level: 20, description: 'Gain your final Paladin subclass feature.' }
            ]
        }
    ],
    Ranger: [
        {
            level: 1, features: [
                {
                    name: 'Core Ranger Traits',
                    level: 1,
                    description: 'Gain tracking and exploration abilities.',
                    choices: {
                        title: 'Choose 3 Skill Proficiencies',
                        count: 3,
                        options: ['Animal Handling', 'Athletics', 'Insight', 'Investigation', 'Nature', 'Perception', 'Stealth', 'Survival']
                    }
                },
                { name: 'Spellcasting', level: 1, description: 'Cast spells using Wisdom.' },
                { name: 'Favored Enemy', level: 1, description: 'Gain favored enemy tracking and combat benefits.' },
                { name: 'Weapon Mastery', level: 1, description: 'Gain mastery options for selected weapons.' }
            ]
        },
        {
            level: 2, features: [
                { name: 'Deft Explorer', level: 2, description: 'Gain exploration and travel utility upgrades.' },
                { name: 'Fighting Style', level: 2, description: 'Choose your Ranger fighting style.' }
            ]
        },
        {
            level: 3, features: [
                { name: 'Ranger Subclass', level: 3, description: 'Choose your Ranger subclass.' }
            ]
        },
        {
            level: 4, features: [
                { name: 'Ability Score Improvement', level: 4, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 5, features: [
                { name: 'Extra Attack', level: 5, description: 'Attack twice when taking the Attack action.' }
            ]
        },
        {
            level: 6, features: [
                { name: 'Roving', level: 6, description: 'Gain improved movement and traversal benefits.' }
            ]
        },
        {
            level: 7, features: [
                { name: 'Subclass Feature', level: 7, description: 'Gain a feature from your Ranger subclass.' }
            ]
        },
        {
            level: 8, features: [
                { name: 'Ability Score Improvement', level: 8, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 9, features: [
                { name: 'Expertise', level: 9, description: 'Expand your specialized skill expertise.' }
            ]
        },
        {
            level: 10, features: [
                { name: 'Tireless', level: 10, description: 'Gain improved stamina and recovery utility.' }
            ]
        },
        {
            level: 11, features: [
                { name: 'Subclass Feature', level: 11, description: 'Gain a feature from your Ranger subclass.' }
            ]
        },
        {
            level: 12, features: [
                { name: 'Ability Score Improvement', level: 12, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 13, features: [
                { name: 'Relentless Hunter', level: 13, description: 'Your hunting pressure improves in prolonged encounters.' }
            ]
        },
        {
            level: 14, features: [
                { name: 'Nature\'s Veil', level: 14, description: 'Gain concealment and repositioning support.' }
            ]
        },
        {
            level: 15, features: [
                { name: 'Subclass Feature', level: 15, description: 'Gain a feature from your Ranger subclass.' }
            ]
        },
        {
            level: 16, features: [
                { name: 'Ability Score Improvement', level: 16, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 17, features: [
                { name: 'Precise Hunter', level: 17, description: 'Gain higher-tier precision tools.' }
            ]
        },
        {
            level: 18, features: [
                { name: 'Feral Senses', level: 18, description: 'Your awareness becomes exceptionally sharp.' }
            ]
        },
        {
            level: 19, features: [
                { name: 'Epic Boon', level: 19, description: 'Gain a powerful epic boon.' }
            ]
        },
        {
            level: 20, features: [
                { name: 'Foe Slayer', level: 20, description: 'Gain your Ranger capstone feature.' }
            ]
        }
    ],
    Rogue: [
        {
            level: 1, features: [
                {
                    name: 'Core Rogue Traits',
                    level: 1,
                    description: 'Master stealth, precision, and deception.',
                    choices: {
                        title: 'Choose 4 Skill Proficiencies from any skills',
                        count: 4,
                        options: ['Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception', 'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine', 'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion', 'Sleight of Hand', 'Stealth', 'Survival']
                    }
                },
                { name: 'Expertise', level: 1, description: 'Double proficiency bonus on chosen proficiencies.' },
                { name: 'Sneak Attack', level: 1, description: 'Deal extra damage when conditions are met.' },
                { name: 'Thieves\' Cant', level: 1, description: 'Understand and use rogue cant communication.' },
                { name: 'Weapon Mastery', level: 1, description: 'Gain mastery options for selected weapons.' }
            ]
        },
        {
            level: 2, features: [
                { name: 'Cunning Action', level: 2, description: 'Use bonus actions for mobility and stealth options.' }
            ]
        },
        {
            level: 3, features: [
                { name: 'Rogue Subclass', level: 3, description: 'Choose your Rogue subclass.' },
                { name: 'Steady Aim', level: 3, description: 'Use careful aiming to improve attack reliability.' }
            ]
        },
        {
            level: 4, features: [
                { name: 'Ability Score Improvement', level: 4, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 5, features: [
                { name: 'Cunning Strike', level: 5, description: 'Apply tactical strike riders to sneak attack turns.' },
                { name: 'Uncanny Dodge', level: 5, description: 'Reduce incoming damage using your reaction.' }
            ]
        },
        {
            level: 6, features: [
                { name: 'Expertise', level: 6, description: 'Gain additional expertise choices.' }
            ]
        },
        {
            level: 7, features: [
                { name: 'Evasion', level: 7, description: 'Improve survivability against area effects.' },
                { name: 'Reliable Talent', level: 7, description: 'Increase consistency on proficient checks.' }
            ]
        },
        {
            level: 8, features: [
                { name: 'Ability Score Improvement', level: 8, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 9, features: [
                { name: 'Subclass Feature', level: 9, description: 'Gain a feature from your Rogue subclass.' }
            ]
        },
        {
            level: 10, features: [
                { name: 'Ability Score Improvement', level: 10, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 11, features: [
                { name: 'Improved Cunning Strike', level: 11, description: 'Your cunning strike options improve.' }
            ]
        },
        {
            level: 12, features: [
                { name: 'Ability Score Improvement', level: 12, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 13, features: [
                { name: 'Subclass Feature', level: 13, description: 'Gain a feature from your Rogue subclass.' }
            ]
        },
        {
            level: 14, features: [
                { name: 'Devious Strikes', level: 14, description: 'Gain advanced strike manipulation options.' }
            ]
        },
        {
            level: 15, features: [
                { name: 'Slippery Mind', level: 15, description: 'Your mental defenses improve.' }
            ]
        },
        {
            level: 16, features: [
                { name: 'Ability Score Improvement', level: 16, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 17, features: [
                { name: 'Subclass Feature', level: 17, description: 'Gain a feature from your Rogue subclass.' }
            ]
        },
        {
            level: 18, features: [
                { name: 'Elusive', level: 18, description: 'Become extremely difficult to pin down.' }
            ]
        },
        {
            level: 19, features: [
                { name: 'Epic Boon', level: 19, description: 'Gain a powerful epic boon.' }
            ]
        },
        {
            level: 20, features: [
                { name: 'Stroke of Luck', level: 20, description: 'Gain your Rogue capstone feature.' }
            ]
        }
    ],
    Sorcerer: [
        {
            level: 1, features: [
                {
                    name: 'Core Sorcerer Traits',
                    level: 1,
                    description: 'Gain innate arcane spellcasting from your bloodline or origin.',
                    choices: {
                        title: 'Choose 2 Skill Proficiencies',
                        count: 2,
                        options: ['Arcana', 'Deception', 'Insight', 'Intimidation', 'Persuasion', 'Religion']
                    }
                },
                { name: 'Spellcasting', level: 1, description: 'Cast spells using Charisma. Know 4 cantrips and have 2 1st-level spell slots.' },
                { name: 'Sorcerous Origin', level: 1, description: 'Choose your Sorcerous Origin, which grants subclass features at levels 1, 6, 14, and 18.' }
            ]
        },
        {
            level: 2, features: [
                { name: 'Font of Magic', level: 2, description: 'Gain Sorcery Points (2 at this level) to fuel class features and convert spell slots.' }
            ]
        },
        {
            level: 3, features: [
                { name: 'Metamagic', level: 3, description: 'Choose 2 Metamagic options to modify your spells.' }
            ]
        },
        {
            level: 4, features: [
                { name: 'Ability Score Improvement', level: 4, description: 'Increase one ability score by 2, or two ability scores by 1 each.' },
                { name: 'Sorcerous Versatility (Optional)', level: 4, description: 'Optional class feature allowing flexible spell or cantrip changes.' }
            ]
        },
        {
            level: 5, features: [
                { name: 'Magical Guidance (Optional)', level: 5, description: 'Optional feature allowing a Sorcery Point to reroll a failed ability check.' }
            ]
        },
        {
            level: 6, features: [
                { name: 'Sorcerous Origin Feature', level: 6, description: 'Gain an additional feature from your chosen Sorcerous Origin.' }
            ]
        },
        {
            level: 8, features: [
                { name: 'Ability Score Improvement', level: 8, description: 'Increase one ability score by 2, or two ability scores by 1 each.' },
                { name: 'Sorcerous Versatility (Optional)', level: 8, description: 'Optional class feature allowing flexible spell or cantrip changes.' }
            ]
        },
        {
            level: 10, features: [
                { name: 'Metamagic', level: 10, description: 'Learn one additional Metamagic option.' }
            ]
        },
        {
            level: 12, features: [
                { name: 'Ability Score Improvement', level: 12, description: 'Increase one ability score by 2, or two ability scores by 1 each.' },
                { name: 'Sorcerous Versatility (Optional)', level: 12, description: 'Optional class feature allowing flexible spell or cantrip changes.' }
            ]
        },
        {
            level: 14, features: [
                { name: 'Sorcerous Origin Feature', level: 14, description: 'Gain another feature from your chosen Sorcerous Origin.' }
            ]
        },
        {
            level: 16, features: [
                { name: 'Ability Score Improvement', level: 16, description: 'Increase one ability score by 2, or two ability scores by 1 each.' },
                { name: 'Sorcerous Versatility (Optional)', level: 16, description: 'Optional class feature allowing flexible spell or cantrip changes.' }
            ]
        },
        {
            level: 17, features: [
                { name: 'Metamagic', level: 17, description: 'Learn one additional Metamagic option.' }
            ]
        },
        {
            level: 18, features: [
                { name: 'Sorcerous Origin Feature', level: 18, description: 'Gain your final high-level feature from your chosen Sorcerous Origin.' }
            ]
        },
        {
            level: 19, features: [
                { name: 'Ability Score Improvement', level: 19, description: 'Increase one ability score by 2, or two ability scores by 1 each.' },
                { name: 'Sorcerous Versatility (Optional)', level: 19, description: 'Optional class feature allowing flexible spell or cantrip changes.' }
            ]
        },
        {
            level: 20, features: [
                { name: 'Sorcerous Restoration', level: 20, description: 'At capstone, recover spent Sorcery Points on short rest as defined by class rules.' }
            ]
        }
    ],
    Warlock: [
        {
            level: 1, features: [
                {
                    name: 'Core Warlock Traits',
                    level: 1,
                    description: 'Form a pact for eldritch power.',
                    choices: {
                        title: 'Choose 2 Skill Proficiencies',
                        count: 2,
                        options: ['Arcana', 'Deception', 'History', 'Insight', 'Intimidation', 'Investigation', 'Nature', 'Religion']
                    }
                },
                { name: 'Eldritch Invocations', level: 1, description: 'Gain eldritch invocation options.' },
                { name: 'Pact Magic', level: 1, description: 'Cast spells using Warlock pact magic.' }
            ]
        },
        {
            level: 2, features: [
                { name: 'Magical Cunning', level: 2, description: 'Improve your pact resource utility.' }
            ]
        },
        {
            level: 3, features: [
                { name: 'Warlock Subclass', level: 3, description: 'Choose your Warlock subclass.' }
            ]
        },
        {
            level: 4, features: [
                { name: 'Ability Score Improvement', level: 4, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 6, features: [
                { name: 'Subclass Feature', level: 6, description: 'Gain a feature from your Warlock subclass.' }
            ]
        },
        {
            level: 8, features: [
                { name: 'Ability Score Improvement', level: 8, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 9, features: [
                { name: 'Contact Patron', level: 9, description: 'Gain expanded communion with your patron.' }
            ]
        },
        {
            level: 10, features: [
                { name: 'Subclass Feature', level: 10, description: 'Gain a feature from your Warlock subclass.' }
            ]
        },
        {
            level: 11, features: [
                { name: 'Mystic Arcanum (level 6 spell)', level: 11, description: 'Gain a once-per-long-rest 6th-level arcanum spell.' }
            ]
        },
        {
            level: 12, features: [
                { name: 'Ability Score Improvement', level: 12, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 13, features: [
                { name: 'Mystic Arcanum (level 7 spell)', level: 13, description: 'Gain a once-per-long-rest 7th-level arcanum spell.' }
            ]
        },
        {
            level: 14, features: [
                { name: 'Subclass Feature', level: 14, description: 'Gain a feature from your Warlock subclass.' }
            ]
        },
        {
            level: 15, features: [
                { name: 'Mystic Arcanum (level 8 spell)', level: 15, description: 'Gain a once-per-long-rest 8th-level arcanum spell.' }
            ]
        },
        {
            level: 16, features: [
                { name: 'Ability Score Improvement', level: 16, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 17, features: [
                { name: 'Mystic Arcanum (level 9 spell)', level: 17, description: 'Gain a once-per-long-rest 9th-level arcanum spell.' }
            ]
        },
        {
            level: 19, features: [
                { name: 'Epic Boon', level: 19, description: 'Gain a powerful epic boon.' }
            ]
        },
        {
            level: 20, features: [
                { name: 'Eldritch Master', level: 20, description: 'Gain your Warlock capstone feature.' }
            ]
        }
    ],
    Wizard: [
        {
            level: 1, features: [
                {
                    name: 'Core Wizard Traits',
                    level: 1,
                    description: 'Gain the broadest arcane spell access through study.',
                    choices: {
                        title: 'Choose 2 Skill Proficiencies',
                        count: 2,
                        options: ['Arcana', 'History', 'Insight', 'Investigation', 'Medicine', 'Religion']
                    }
                },
                { name: 'Spellcasting', level: 1, description: 'Cast spells using Intelligence.' },
                { name: 'Ritual Adept', level: 1, description: 'Gain enhanced ritual-casting utility.' },
                { name: 'Arcane Recovery', level: 1, description: 'Recover expended spell resources on short rest.' }
            ]
        },
        {
            level: 2, features: [
                { name: 'Scholar', level: 2, description: 'Gain scholarly magical utility improvements.' }
            ]
        },
        {
            level: 3, features: [
                { name: 'Wizard Subclass', level: 3, description: 'Choose your Wizard subclass.' }
            ]
        },
        {
            level: 4, features: [
                { name: 'Ability Score Improvement', level: 4, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 5, features: [
                { name: 'Memorize Spell', level: 5, description: 'Gain expanded preparation flexibility.' }
            ]
        },
        {
            level: 6, features: [
                { name: 'Subclass Feature', level: 6, description: 'Gain a feature from your Wizard subclass.' }
            ]
        },
        {
            level: 8, features: [
                { name: 'Ability Score Improvement', level: 8, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 10, features: [
                { name: 'Subclass Feature', level: 10, description: 'Gain a feature from your Wizard subclass.' }
            ]
        },
        {
            level: 12, features: [
                { name: 'Ability Score Improvement', level: 12, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 14, features: [
                { name: 'Subclass Feature', level: 14, description: 'Gain a feature from your Wizard subclass.' }
            ]
        },
        {
            level: 16, features: [
                { name: 'Ability Score Improvement', level: 16, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 18, features: [
                { name: 'Spell Mastery', level: 18, description: 'Master selected spells for frequent use.' }
            ]
        },
        {
            level: 19, features: [
                { name: 'Epic Boon', level: 19, description: 'Gain a powerful epic boon.' }
            ]
        },
        {
            level: 20, features: [
                { name: 'Signature Spells', level: 20, description: 'Gain your Wizard capstone feature.' }
            ]
        }
    ]
};

const classInfoMap: Record<string, BuilderInfo> = {
    Barbarian: {
        name: 'Barbarian',
        source: "Player's Handbook",
        summary: 'A fierce warrior powered by primal rage and relentless physical resilience.',
        highlights: ['Primary focus: Strength and Constitution', 'Core feature: Rage for damage resistance and extra melee pressure', 'Excellent survivability from level 1 onward'],
        details: {
            tagline: 'A Fierce Warrior of Primal Rage',
            primaryAbility: 'Strength',
            hitPointDie: 'd12 per Barbarian level',
            saves: 'Strength and Constitution',
            levelOneGains: [
                'Gain all traits in the Core Barbarian Traits list.',
                'Gain level 1 Barbarian features, including Rage and Unarmored Defense.',
                'Choose starting equipment package or gold alternative.'
            ],
            coreTraits: [
                { label: 'Primary Ability', value: 'Strength' },
                { label: 'Hit Point Die', value: 'd12 per Barbarian level' },
                { label: 'Saving Throw Proficiencies', value: 'Strength and Constitution' },
                { label: 'Skill Proficiencies', value: 'Choose 2: Animal Handling, Athletics, Intimidation, Nature, Perception, Survival' },
                { label: 'Weapon Proficiencies', value: 'Simple and Martial weapons' },
                { label: 'Armor Training', value: 'Light armor, Medium armor, Shields' },
                { label: 'Starting Equipment', value: 'A: Greataxe, 4 Handaxes, Explorer’s Pack, 15 GP; or B: 75 GP' }
            ],
            levelMilestones: [
                { title: 'Level 1', summary: 'Rage (2/day), Unarmored Defense', details: 'You enter Rage as a bonus action and become much tougher in melee; Unarmored Defense uses Dexterity and Constitution to set AC when unarmored.' },
                { title: 'Level 2', summary: 'Reckless Attack, Danger Sense', details: 'You can choose high-risk advantage on Strength melee attacks, and gain better Dex-save survivability against visible threats.' },
                { title: 'Level 3', summary: 'Primal Path (subclass), Rage 3/day', details: 'Subclass identity begins here; many path features continue at 6, 10, and 14.' },
                { title: 'Level 4', summary: 'Ability Score Improvement', details: 'First major stat/feat breakpoint for build direction.' },
                { title: 'Level 5', summary: 'Extra Attack, Fast Movement', details: 'Two attacks per Attack action plus movement bonus create a strong frontline power spike.' },
                { title: 'Level 7', summary: 'Feral Instinct (and optional Instinctive Pounce)', details: 'Initiative improves and your opening turns become more explosive, especially when entering Rage.' },
                { title: 'Level 9', summary: 'Brutal Critical (1 extra die), Rage damage +3', details: 'Critical hits scale upward and your baseline Rage offense improves.' },
                { title: 'Level 11', summary: 'Relentless Rage', details: 'When dropped to 0 HP while raging, you can make a Con save to stay at 1 HP instead.' },
                { title: 'Level 13', summary: 'Brutal Critical (2 extra dice)', details: 'Critical hit scaling increases again for larger burst turns.' },
                { title: 'Level 15', summary: 'Persistent Rage', details: 'Rage becomes harder to lose early, improving consistency in drawn-out encounters.' },
                { title: 'Level 17', summary: 'Brutal Critical (3 extra dice), Rage damage +4', details: 'Top-end offense rises again through both crit scaling and Rage bonus damage.' },
                { title: 'Level 18', summary: 'Indomitable Might', details: 'Very low Strength-check outcomes are smoothed out, making physical checks highly reliable.' },
                { title: 'Level 19', summary: 'Ability Score Improvement', details: 'Final major customization point before capstone.' },
                { title: 'Level 20', summary: 'Primal Champion, unlimited Rage', details: 'Strength and Constitution increase by 4 each (up to 24), and Rage uses are no longer limited.' }
            ],
            featureNotes: [
                { title: 'Rage Core Rules', summary: 'Bonus action start, 1-minute duration, limited uses by level.', details: 'Rage ends early if combat pressure stops unless later class features prevent that; early levels track uses per long rest.' },
                { title: 'Rage Benefits', summary: 'Damage resistance, Strength-check edge, and bonus melee damage.', details: 'While raging (and not in heavy armor), you resist common weapon damage and gain stronger Strength-based offense and utility.' },
                { title: 'Rage Limitations', summary: 'No casting or concentration during Rage.', details: 'Rage commits your turn economy to martial play and positioning decisions.' },
                { title: 'Unarmored Defense', summary: 'AC uses Dexterity + Constitution while unarmored.', details: 'You can still use a shield and keep the Unarmored Defense formula active.' },
                { title: 'Reckless Attack Tradeoff', summary: 'Gain advantage now, give enemies advantage until next turn.', details: 'This is a core risk/reward lever for pushing damage in key rounds.' },
                { title: 'Danger Sense Condition', summary: 'Dex-save edge requires awareness and mobility.', details: 'The benefit applies against visible effects and is lost when severely impaired.' },
                { title: 'Brutal Critical Scaling', summary: 'Extra crit dice at 9, 13, and 17.', details: 'Critical burst potential becomes a defining high-level damage trait.' },
                { title: 'Relentless Rage Scaling', summary: 'Con save DC starts low and rises with repeated use.', details: 'This creates dramatic durability moments while preventing endless loop protection.' },
                { title: 'Capstone Profile', summary: 'Primal Champion boosts Strength/Constitution and max values.', details: 'At top level, Barbarian reaches elite offense and toughness, with unlimited Rage support.' }
            ]
        }
    },
    'Blood Hunter': {
        name: 'Blood Hunter',
        source: 'Critical Role (DND Beyond)',
        summary: 'A martial hunter who uses hemocraft, blood curses, and self-sacrifice to track and eliminate supernatural threats.',
        highlights: ['Primary focus: Dexterity or Strength with Intelligence (or Wisdom variant)', 'Core features: Blood Maledict and Crimson Rite', 'Hybrid role: frontline pressure, tracking utility, and anti-monster control']
    },
    Bard: { name: 'Bard', source: "Player's Handbook", summary: 'Versatile support caster with social utility and strong team buffs.', highlights: ['Primary focus: Charisma', 'Core feature: Bardic Inspiration', 'Covers support, control, and utility roles'] },
    Cleric: { name: 'Cleric', source: "Player's Handbook", summary: 'Divine caster with healing, protection, and domain-based specialization.', highlights: ['Primary focus: Wisdom', 'Core feature: Channel Divinity', 'Excellent support with strong defensive options'] },
    Druid: { name: 'Druid', source: "Player's Handbook", summary: 'Nature-focused caster with flexible control and transformation options.', highlights: ['Primary focus: Wisdom', 'Core feature: Wild Shape', 'Strong battlefield control and utility toolkit'] },
    Fighter: { name: 'Fighter', source: "Player's Handbook", summary: 'Reliable martial class with strong action economy and weapon mastery.', highlights: ['Primary focus: Strength or Dexterity', 'Core feature: Action Surge', 'Consistent damage and broad subclass flexibility'] },
    Monk: { name: 'Monk', source: "Player's Handbook", summary: 'Mobile skirmisher using discipline points for speed, strikes, and control.', highlights: ['Primary focus: Dexterity and Wisdom', 'Core feature: Martial Arts and Ki/Discipline', 'High mobility and evasive playstyle'] },
    Paladin: { name: 'Paladin', source: "Player's Handbook", summary: 'Holy warrior blending melee offense, auras, and limited spellcasting.', highlights: ['Primary focus: Strength and Charisma', 'Core feature: Divine Smite', 'Great team protection through aura effects'] },
    Ranger: { name: 'Ranger', source: "Player's Handbook", summary: 'Martial explorer with tracking, ranged/melee options, and nature magic.', highlights: ['Primary focus: Dexterity or Strength with Wisdom', 'Core feature: favored utility/exploration tools', 'Balanced damage with exploration strengths'] },
    Rogue: { name: 'Rogue', source: "Player's Handbook", summary: 'Precision striker focused on positioning, stealth, and utility skills.', highlights: ['Primary focus: Dexterity', 'Core feature: Sneak Attack', 'Excellent out-of-combat skill coverage'] },
    Sorcerer: { name: 'Sorcerer', source: "Player's Handbook", summary: 'Innate arcane caster with metamagic-driven spell customization.', highlights: ['Primary focus: Charisma', 'Core feature: Metamagic', 'Powerful burst casting with limited spell knowns'] },
    Warlock: { name: 'Warlock', source: "Player's Handbook", summary: 'Pact-based caster with reliable cantrip pressure and unique invocations.', highlights: ['Primary focus: Charisma', 'Core feature: Eldritch Invocations', 'Short-rest spell slots with strong at-will options'] },
    Wizard: { name: 'Wizard', source: "Player's Handbook", summary: 'Broadest spell access with high utility and deep arcane specialization.', highlights: ['Primary focus: Intelligence', 'Core feature: Spellbook casting', 'Exceptional flexibility through spell preparation'] }
};

const classDetailFallbacks: Record<string, NonNullable<BuilderInfo['details']>> = {
    'Blood Hunter': {
        tagline: 'A Hemocraft Warrior Who Hunts Darkness with Sacrifice',
        primaryAbility: 'Dexterity or Strength; Hemocraft uses Intelligence (or Wisdom variant)',
        hitPointDie: 'd10 per Blood Hunter level',
        saves: 'Dexterity and Intelligence',
        levelOneGains: [
            "Gain Hunter's Bane and Blood Maledict, establishing your tracking identity and blood-curse resource at level 1.",
            'Start with martial weapon and medium-armor baseline, but class output depends on managing self-inflicted hemocraft costs.',
            'Early build direction centers on weapon style, curse choice, and whether you lean mobile skirmish or direct frontline pressure.'
        ],
        coreTraits: [
            { label: 'Primary Ability', value: 'Dexterity or Strength; Int/Wis for hemocraft features' },
            { label: 'Hit Point Die', value: 'd10 per Blood Hunter level' },
            { label: 'Saving Throws', value: 'Dexterity and Intelligence' },
            { label: 'Armor Training', value: 'Light armor, medium armor, shields' },
            { label: 'Weapon Proficiencies', value: 'Simple and martial weapons' },
            { label: 'Role', value: 'Martial striker with curse utility, tracking support, and anti-monster control tools' }
        ],
        levelMilestones: [
            {
                title: 'Level 1',
                summary: "Hunter's Bane and Blood Maledict",
                details: 'You gain supernatural tracking against fey, fiends, and undead plus your first Blood Curse, with optional amplification at the cost of hemocraft damage.'
            },
            {
                title: 'Level 2',
                summary: 'Fighting Style and Crimson Rite',
                details: 'Crimson Rite adds scaling elemental damage to weapon attacks and defines your risk-reward loop through self-inflicted rite activation damage.'
            },
            {
                title: 'Level 3',
                summary: 'Blood Hunter Order',
                details: 'Subclass path (Ghostslayer, Lycan, Mutant, or Profane Soul) sets your tactical identity and feature progression through high levels.'
            },
            {
                title: 'Level 5',
                summary: 'Extra Attack and hemocraft die growth',
                details: 'Core martial throughput stabilizes and your rite-enhanced weapon turns become more reliable in sustained fights.'
            },
            {
                title: 'Level 6',
                summary: 'Brand of Castigation and more curses per rest',
                details: 'You can brand priority targets for tracking and retaliation pressure while also increasing Blood Maledict encounter frequency.'
            },
            {
                title: 'Level 10',
                summary: 'Dark Augmentation',
                details: 'Movement speed and key physical save support improve, giving blood hunter a stronger defensive baseline in mid-tier play.'
            },
            {
                title: 'Level 13-14',
                summary: 'Brand of Tethering and Hardened Soul',
                details: 'Control over branded enemies increases, anti-escape utility improves, and charm/frightened resistance strengthens reliability.'
            },
            {
                title: 'Level 20',
                summary: 'Sanguine Mastery',
                details: 'Capstone hemocraft efficiency improves through die reroll flexibility and Blood Maledict recovery on critical rite-enhanced hits.'
            }
        ],
        featureNotes: [
            {
                title: 'Hemocraft Resource Model',
                summary: 'Class power is balanced by intentional self-damage costs.',
                details: 'Crimson Rite activation and amplified curses consume your health as a strategic resource, rewarding smart timing and target priority.'
            },
            {
                title: 'Blood Maledict Scaling',
                summary: 'Curses known and uses per rest increase by level.',
                details: 'You gain extra curse selections over time and more frequent uses, allowing broader encounter answers in longer adventuring days.'
            },
            {
                title: 'Crimson Rite Identity',
                summary: 'Weapon infusion adds magical and elemental pressure.',
                details: 'Rite choices and damage type flexibility support adaptation to enemy resistances and campaign threat profiles.'
            },
            {
                title: 'Brand Control Package',
                summary: 'Brand features improve pursuit and anti-escape pressure.',
                details: 'Brand of Castigation and later Brand of Tethering turn blood hunter into a strong target-lock specialist against dangerous enemies.'
            },
            {
                title: 'Order-Driven Playstyle',
                summary: 'Subclass strongly changes combat rhythm and utility.',
                details: 'Orders can shift you toward martial ferocity, occult spell support, mutagen specialization, or anti-undead pressure and radiant themes.'
            },
            {
                title: 'Build Discipline',
                summary: 'Positioning and health management are central skill tests.',
                details: 'Because you spend HP for power, successful blood hunter play requires balancing aggression with survivability and recovery planning.'
            }
        ]
    },
    Bard: {
        tagline: 'A Versatile Performer and Arcane Support Specialist',
        primaryAbility: 'Charisma',
        hitPointDie: 'd8 per Bard level',
        saves: 'Dexterity and Charisma',
        levelOneGains: [
            'Gain Spellcasting and Bardic Inspiration, establishing both support and control identity at level 1.',
            'Start with light armor plus broad weapon and skill access, making Bard effective in social and exploration scenes immediately.',
            'Choose cantrips and early spells that define your party role: tempo support, crowd control, or utility coverage.'
        ],
        coreTraits: [
            { label: 'Primary Ability', value: 'Charisma' },
            { label: 'Hit Point Die', value: 'd8 per Bard level' },
            { label: 'Saving Throws', value: 'Dexterity and Charisma' },
            { label: 'Armor Training', value: 'Light armor' },
            { label: 'Weapon Proficiencies', value: 'Simple weapons, hand crossbows, longswords, rapiers, shortswords' },
            { label: 'Role', value: 'Support, control, utility, and social leadership with strong skill expression' }
        ],
        levelMilestones: [
            {
                title: 'Level 1',
                summary: 'Bardic Inspiration and Spellcasting',
                details: 'You begin with a flexible support engine: inspiration dice for allies and a spell list that can pivot between healing, control, and utility. Early turn decisions usually balance concentration setup with inspiration timing.'
            },
            {
                title: 'Level 2',
                summary: 'Jack of All Trades and Song of Rest',
                details: 'Bard becomes broadly reliable by adding partial proficiency to many checks, improving initiative and utility rolls. Song of Rest adds steady out-of-combat sustain for parties that value short-rest pacing.'
            },
            {
                title: 'Level 3',
                summary: 'Bard College and Expertise',
                details: 'Subclass choice sharply defines your playstyle, from martial-leaning pressure to pure support/control focus. Expertise doubles down on signature skills, often making Bard the party lead in social and exploration encounters.'
            },
            {
                title: 'Level 5',
                summary: 'Font of Inspiration and 3rd-level spells',
                details: 'Inspiration becomes much easier to sustain over multiple encounters, and your spell impact rises with stronger control and team-enabling options. This is one of the class’s biggest practical power spikes.'
            },
            {
                title: 'Level 10',
                summary: 'Magical Secrets access',
                details: 'You can select powerful off-list spells to fill party gaps or unlock unique combos. This is where Bard often shifts from strong support into true strategic wildcard territory.'
            },
            {
                title: 'Level 14',
                summary: 'Advanced College feature',
                details: 'Your subclass identity matures with high-impact features that either improve survivability, tempo control, or offensive utility depending on college.'
            },
            {
                title: 'Level 18',
                summary: 'Expanded Magical Secrets',
                details: 'Additional off-list spell picks dramatically increase your late-game adaptability, letting you answer high-tier encounter demands more consistently.'
            },
            {
                title: 'Level 20',
                summary: 'Superior Inspiration',
                details: 'Even in low-resource moments, Bard retains baseline support reliability, helping maintain team tempo in long adventuring days or late-fight recovery turns.'
            }
        ],
        featureNotes: [
            {
                title: 'Bardic Inspiration Economy',
                summary: 'Support dice scale over time and reward timing discipline.',
                details: 'Inspiration is most valuable when used to secure high-leverage checks, attack rolls, or saves. Great Bard play often comes from anticipating when allies are about to make encounter-defining rolls.'
            },
            {
                title: 'Spell Role Flexibility',
                summary: 'Bard can pivot between control, support, and utility loadouts.',
                details: 'Because spell choices determine your moment-to-moment role, Bard rewards deliberate preparation and concentration management rather than pure damage racing.'
            },
            {
                title: 'Expertise and Skill Dominance',
                summary: 'Double proficiency creates elite reliability in chosen pillars.',
                details: 'With strong skill coverage plus Jack of All Trades, Bard contributes meaningfully even outside combat-heavy sessions.'
            },
            {
                title: 'College Identity',
                summary: 'Subclass determines your tactical personality.',
                details: 'Different colleges can shift Bard toward weapon pressure, enhanced support loops, disruptive control, or broader utility leadership.'
            },
            {
                title: 'Magical Secrets Strategy',
                summary: 'Off-list spells are your biggest strategic customization lever.',
                details: 'Choosing spells that fill missing party roles can turn Bard into a multi-role anchor in mid and late tiers.'
            },
            {
                title: 'Concentration Management',
                summary: 'Bard impact often hinges on maintaining key effects.',
                details: 'Positioning, defense choices, and spell sequencing matter because many top Bard options are concentration-based.'
            },
            {
                title: 'Resource Pacing',
                summary: 'Bard excels with thoughtful encounter-to-encounter planning.',
                details: 'Balancing spell slots, inspiration uses, and control priorities keeps your output steady across full adventuring days.'
            }
        ]
    },
    Cleric: {
        tagline: 'A Divine Caster of Protection, Healing, and Judgment',
        primaryAbility: 'Wisdom',
        hitPointDie: 'd8 per Cleric level',
        saves: 'Wisdom and Charisma',
        levelOneGains: [
            'Gain prepared divine spellcasting and a Divine Domain at level 1, immediately shaping both role and spell access.',
            'Begin with strong baseline durability options and defensive tools that support frontline or backline support builds.',
            'Build identity forms around concentration management, positioning, and high-value reaction or recovery timing.'
        ],
        coreTraits: [
            { label: 'Primary Ability', value: 'Wisdom' },
            { label: 'Hit Point Die', value: 'd8 per Cleric level' },
            { label: 'Saving Throws', value: 'Wisdom and Charisma' },
            { label: 'Armor Training', value: 'Light and medium armor, shields (domain dependent boosts possible)' },
            { label: 'Weapon Proficiencies', value: 'Simple weapons (domain features can expand)' },
            { label: 'Role', value: 'Healing, defense, buffs, control, and divine offense across all tiers' }
        ],
        levelMilestones: [
            {
                title: 'Level 1',
                summary: 'Divine Domain and spellcasting begin',
                details: 'Domain choice immediately defines your practical role through bonus proficiencies, extra domain spells, and first-level features. Cleric starts with strong tactical relevance on day one.'
            },
            {
                title: 'Level 2',
                summary: 'Channel Divinity online',
                details: 'You unlock a high-impact class resource that can swing encounters through domain-specific power spikes or anti-undead control effects.'
            },
            {
                title: 'Level 5',
                summary: '3rd-level spell breakpoint',
                details: 'This tier expands encounter influence significantly with better area control, restoration options, and stronger party stabilization tools.'
            },
            {
                title: 'Level 8',
                summary: 'Domain scaling and ASI rhythm',
                details: 'Subclass identity becomes more pronounced while your stat progression supports improved save DCs, concentration uptime, or frontline durability.'
            },
            {
                title: 'Level 10',
                summary: 'Divine Intervention enters play',
                details: 'You gain a high-ceiling feature that reinforces the class fantasy of direct divine influence in critical moments.'
            },
            {
                title: 'Level 14',
                summary: 'Late-mid spell and feature maturity',
                details: 'Your toolkit broadens into stronger high-tier effects while domain mechanics gain enough depth to support distinct tactical styles.'
            },
            {
                title: 'Level 17',
                summary: 'Final domain feature tier',
                details: 'Subclass cap features often redefine how you approach major encounters, either through raw power, reliability, or unique support value.'
            },
            {
                title: 'Level 20',
                summary: 'Divine Intervention reliability peak',
                details: 'At capstone levels, the class reaches top-tier consistency in high-impact support and encounter-changing divine effects.'
            }
        ],
        featureNotes: [
            {
                title: 'Prepared Spellcasting Depth',
                summary: 'Daily preparation supports encounter-specific planning.',
                details: 'Cleric can reconfigure spell loadouts to answer dungeon crawls, social-heavy arcs, survival challenges, or boss-focused sessions without changing core class identity.'
            },
            {
                title: 'Domain Spell Access',
                summary: 'Always-prepared domain spells free up planning budget.',
                details: 'Because key thematic spells are automatically prepared, you can allocate normal preparation slots toward utility, defense, or niche answers as needed.'
            },
            {
                title: 'Channel Divinity Timing',
                summary: 'Limited-use feature with high tactical leverage.',
                details: 'Best use cases are usually pivotal rounds where resource conversion into immediate tempo or survivability matters most.'
            },
            {
                title: 'Concentration Prioritization',
                summary: 'Many top cleric plays rely on maintained effects.',
                details: 'Build choices and positioning that protect concentration often outperform short-term burst decisions over full adventuring days.'
            },
            {
                title: 'Role Elasticity',
                summary: 'Cleric can shift between support and pressure.',
                details: 'Depending on domain and prepared spells, you can function as anchor healer, control caster, durable frontliner, or hybrid support striker.'
            },
            {
                title: 'Team Stability',
                summary: 'Class has one of the strongest recovery floors.',
                details: 'Cleric keeps groups operational through healing, condition removal, and defensive buffs that reduce failure cascades in long fights.'
            }
        ]
    },
    Druid: {
        tagline: 'A Nature Caster with Adaptable Battlefield Tools',
        primaryAbility: 'Wisdom',
        hitPointDie: 'd8 per Druid level',
        saves: 'Intelligence and Wisdom',
        levelOneGains: [
            'Gain full spellcasting with early access to strong control, utility, and sustain tools.',
            'Class identity begins as a flexible planner that can answer both battlefield and travel challenges.',
            'Early spell choices define whether you favor terrain control, party support, or encounter pacing pressure.'
        ],
        coreTraits: [
            { label: 'Primary Ability', value: 'Wisdom' },
            { label: 'Hit Point Die', value: 'd8 per Druid level' },
            { label: 'Saving Throws', value: 'Intelligence and Wisdom' },
            { label: 'Armor Training', value: 'Light armor, medium armor, shields (material restrictions by table rulings)' },
            { label: 'Weapon Proficiencies', value: 'Club, dagger, dart, javelin, mace, quarterstaff, scimitar, sickle, sling, spear' },
            { label: 'Role', value: 'Control, utility, scouting, sustain, and adaptable battlefield pacing' }
        ],
        levelMilestones: [
            {
                title: 'Level 2',
                summary: 'Wild Shape and Druid Circle',
                details: 'Core class expression begins here: your Circle decides combat identity while Wild Shape supports scouting, utility, or subclass-specific frontline play.'
            },
            {
                title: 'Level 5',
                summary: '3rd-level spell breakpoint',
                details: 'Battlefield shaping improves sharply through stronger area control and encounter-tempo options that reward planning and positioning.'
            },
            {
                title: 'Level 8',
                summary: 'Mobility and stat progression tier',
                details: 'Ability improvements and subclass scaling help refine whether you lean caster-centric, form-centric, or hybrid play patterns.'
            },
            {
                title: 'Level 10',
                summary: 'Major Circle feature tier',
                details: 'Subclass mechanics mature into reliable encounter-defining tools, often reinforcing durability, control, or utility extremes.'
            },
            {
                title: 'Level 14',
                summary: 'High-tier subclass expression',
                details: 'Circle cap features broaden your strategic options and often shift the ceiling of what your druid can solve in a day.'
            },
            {
                title: 'Level 18',
                summary: 'Improved casting flexibility',
                details: 'Resource handling becomes smoother at high level, enabling stronger endurance in long encounter chains.'
            },
            {
                title: 'Level 20',
                summary: 'Archdruid capstone profile',
                details: 'Top-end druid reaches exceptional sustainability and can repeatedly influence encounters through both spell and class mechanics.'
            }
        ],
        featureNotes: [
            {
                title: 'Wild Shape Utility Layer',
                summary: 'Shapechanging supports scouting, escape, infiltration, and some combat plans.',
                details: 'Even outside direct damage, Wild Shape offers movement modes and utility angles that frequently solve problems without spending key spell slots.'
            },
            {
                title: 'Circle-Driven Identity',
                summary: 'Subclass determines your dominant turn pattern.',
                details: 'Some circles emphasize durable form play, while others maximize casting control or hybrid flexibility around positioning.'
            },
            {
                title: 'Battlefield Control Strength',
                summary: 'Druid is one of the strongest terrain and tempo classes.',
                details: 'Control effects can deny enemy movement, split encounters, and create safe zones for allies when coordinated well.'
            },
            {
                title: 'Concentration Discipline',
                summary: 'Sustained effects often define druid value per encounter.',
                details: 'Choosing which concentration spell to maintain is often more important than maximizing raw single-turn output.'
            },
            {
                title: 'Exploration Impact',
                summary: 'Druid remains relevant in non-combat pillars all campaign.',
                details: 'Environmental interaction, scouting, and utility casting give persistent value between major fights.'
            },
            {
                title: 'Resource Endurance',
                summary: 'Class can distribute impact across many encounters.',
                details: 'By alternating control spells, utility play, and subclass tools, druid can preserve high-value slots for pivotal battles.'
            }
        ]
    },
    Fighter: {
        tagline: 'A Master of Weapons, Tactics, and Reliable Action Economy',
        primaryAbility: 'Strength or Dexterity',
        hitPointDie: 'd10 per Fighter level',
        saves: 'Strength and Constitution',
        levelOneGains: [
            'Gain Fighting Style and Second Wind at level 1, establishing both role identity and early durability.',
            'Start with the broadest practical martial equipment profile for immediate frontline readiness.',
            'Fighter opens with high consistency and low setup requirements, making each turn reliable from session one.'
        ],
        coreTraits: [
            { label: 'Primary Ability', value: 'Strength or Dexterity' },
            { label: 'Hit Point Die', value: 'd10 per Fighter level' },
            { label: 'Saving Throws', value: 'Strength and Constitution' },
            { label: 'Armor Training', value: 'All armor and shields' },
            { label: 'Weapon Proficiencies', value: 'Simple and martial weapons' },
            { label: 'Role', value: 'Frontline damage, control, tactical flexibility, and sustained encounter reliability' }
        ],
        levelMilestones: [
            {
                title: 'Level 1',
                summary: 'Fighting Style and Second Wind',
                details: 'Fighting Style sets your core combat lane while Second Wind improves staying power in attrition-heavy adventuring days.'
            },
            {
                title: 'Level 2',
                summary: 'Action Surge',
                details: 'Action Surge delivers one of the strongest tempo spikes in the system and supports both offense and tactical reposition turns.'
            },
            {
                title: 'Level 3',
                summary: 'Martial Archetype',
                details: 'Subclass path defines whether your fighter leans tactical control, magical utility, precision offense, or defensive anchoring.'
            },
            {
                title: 'Level 5',
                summary: 'Extra Attack baseline',
                details: 'Fighter reaches core martial throughput expectations with reliable multi-attack turns.'
            },
            {
                title: 'Level 11',
                summary: 'Extra Attack (2)',
                details: 'Sustained damage profile jumps significantly, especially when paired with Action Surge burst rounds.'
            },
            {
                title: 'Level 17',
                summary: 'Action Surge cadence improvement',
                details: 'High-level encounter pacing improves with stronger access to your signature action-economy mechanic.'
            },
            {
                title: 'Level 20',
                summary: 'Extra Attack (3)',
                details: 'Endgame fighter reaches exceptional consistency with four attacks per Attack action before surge effects.'
            }
        ],
        featureNotes: [
            {
                title: 'Action Surge Planning',
                summary: 'Best used on rounds that convert tempo into decisive outcomes.',
                details: 'Combining surge with positioning, control effects, or priority-target focus often delivers more value than using it as generic extra damage.'
            },
            {
                title: 'Feat and Stat Flexibility',
                summary: 'Frequent ASI progression supports specialized builds.',
                details: 'Fighter can tune for durability, control, ranged pressure, or burst output without sacrificing baseline consistency.'
            },
            {
                title: 'Subclass Diversity',
                summary: 'Archetypes dramatically change tactical identity.',
                details: 'You can build a straightforward weapon expert or a high-complexity tactical controller while retaining fighter reliability.'
            },
            {
                title: 'Defensive Floor',
                summary: 'Armor, hit die, and self-sustain smooth failure states.',
                details: 'Fighter handles long adventuring days well because survivability tools are simple, repeatable, and hard to disrupt.'
            },
            {
                title: 'Turn-to-Turn Reliability',
                summary: 'Class performs strongly without heavy setup costs.',
                details: 'Fighter is excellent when encounters are unpredictable since core output does not rely on elaborate resource chains.'
            },
            {
                title: 'Team Synergy',
                summary: 'Fighter converts ally setup into efficient pressure.',
                details: 'Reliable attack volume pairs very well with buffs, advantage generation, and enemy control from party members.'
            }
        ]
    },
    Monk: {
        tagline: 'A Fast Precision Striker with Resource-Driven Technique',
        primaryAbility: 'Dexterity and Wisdom',
        hitPointDie: 'd8 per Monk level',
        saves: 'Strength and Dexterity',
        levelOneGains: [
            'Gain Martial Arts at level 1, defining a rapid multi-hit turn structure tied to positioning.',
            'Unarmored movement identity begins early, rewarding target selection and distance control over static frontlining.',
            'Monk effectiveness comes from disciplined resource timing and tactical movement rather than pure stat-check durability.'
        ],
        coreTraits: [
            { label: 'Primary Ability', value: 'Dexterity and Wisdom' },
            { label: 'Hit Point Die', value: 'd8 per Monk level' },
            { label: 'Saving Throws', value: 'Strength and Dexterity' },
            { label: 'Armor Training', value: 'None (unarmored class profile)' },
            { label: 'Weapon Proficiencies', value: 'Simple weapons and monk weapons by ruleset' },
            { label: 'Role', value: 'Skirmish pressure, disruption, and mobility-driven tempo control' }
        ],
        levelMilestones: [
            {
                title: 'Level 2',
                summary: 'Discipline/Ki engine and speed boost',
                details: 'Resource-based offense, defense, and mobility decisions become central to class performance from this level onward.'
            },
            {
                title: 'Level 3',
                summary: 'Monastic Tradition and reactive defense',
                details: 'Subclass route defines tactical personality while defensive tools improve survivability against ranged or burst threats.'
            },
            {
                title: 'Level 5',
                summary: 'Extra Attack and stun pressure',
                details: 'This is a major combat spike where monk can blend repeated hits with high-value disruption windows.'
            },
            {
                title: 'Level 9',
                summary: 'Mobility expression broadens',
                details: 'Movement and terrain interaction tools make target access and disengage patterns much more reliable.'
            },
            {
                title: 'Level 14',
                summary: 'Defensive reliability tier',
                details: 'Saving throw and resilience improvements push monk toward elite survivability when played with disciplined positioning.'
            },
            {
                title: 'Level 18',
                summary: 'High-tier class expression',
                details: 'Late-game monk gains stronger control over pacing and can sustain disruptive pressure across longer encounters.'
            },
            {
                title: 'Level 20',
                summary: 'Capstone consistency',
                details: 'Top-level monk reinforces resource reliability and maintains class identity under prolonged adventuring pressure.'
            }
        ],
        featureNotes: [
            {
                title: 'Martial Arts Tempo',
                summary: 'Bonus-action attacks create steady pressure turns.',
                details: 'Monk often wins through repeated efficient turns that combine chip damage, repositioning, and threat shaping.'
            },
            {
                title: 'Discipline Spending',
                summary: 'Resource allocation drives offense and survival balance.',
                details: 'Overcommitting early can reduce late-fight options, so discipline pacing is one of the most important skill tests for monk play.'
            },
            {
                title: 'Mobility Advantage',
                summary: 'Class can contest space better than most martials.',
                details: 'Superior movement allows monk to pressure backline targets, peel for allies, or disengage from dangerous zones efficiently.'
            },
            {
                title: 'Control Through Pressure',
                summary: 'Stun and disruption create high-value team windows.',
                details: 'Monk control is strongest when coordinated with party burst turns rather than treated as isolated personal output.'
            },
            {
                title: 'Defensive Skill Expression',
                summary: 'Survivability depends on both features and positioning.',
                details: 'Good monk play avoids overexposure and uses movement as a defensive resource, not only an offensive tool.'
            },
            {
                title: 'Role in Party Tempo',
                summary: 'Monk excels at forcing enemy decision strain.',
                details: 'By threatening key targets and repositioning quickly, monk often dictates encounter rhythm beyond raw damage numbers.'
            }
        ]
    },
    Paladin: {
        tagline: 'A Divine Frontliner with Burst Damage and Party Auras',
        primaryAbility: 'Strength and Charisma',
        hitPointDie: 'd10 per Paladin level',
        saves: 'Wisdom and Charisma',
        levelOneGains: [
            'Gain Lay on Hands at level 1, giving immediate emergency healing and stabilization utility.',
            'Heavy armor baseline supports strong early frontline positioning and concentration protection by build.',
            'Paladin starts as a durable striker whose value increases sharply with aura and smite progression.'
        ],
        coreTraits: [
            { label: 'Primary Ability', value: 'Strength and Charisma' },
            { label: 'Hit Point Die', value: 'd10 per Paladin level' },
            { label: 'Saving Throws', value: 'Wisdom and Charisma' },
            { label: 'Armor Training', value: 'All armor and shields' },
            { label: 'Weapon Proficiencies', value: 'Simple and martial weapons' },
            { label: 'Role', value: 'Durable striker with teamwide aura support and burst conversion' }
        ],
        levelMilestones: [
            {
                title: 'Level 2',
                summary: 'Fighting Style, Spellcasting, Divine Smite',
                details: 'Your core combat loop comes online by blending weapon consistency with slot-fueled burst conversion on hit confirmation.'
            },
            {
                title: 'Level 3',
                summary: 'Sacred Oath and Channel Divinity',
                details: 'Oath path and channel options define tactical identity, utility profile, and encounter role emphasis.'
            },
            {
                title: 'Level 6',
                summary: 'Aura of Protection',
                details: 'A major party-defense breakpoint that rewards formation play and dramatically improves team save reliability.'
            },
            {
                title: 'Level 11',
                summary: 'Improved Divine Smite',
                details: 'Sustained damage rises without consuming extra resources, improving long-day consistency.'
            },
            {
                title: 'Level 14',
                summary: 'Support toolkit maturity',
                details: 'By late-mid game, paladin combines aura value, recovery tools, and strong target elimination pressure.'
            },
            {
                title: 'Level 18',
                summary: 'Aura reach improvement',
                details: 'Expanded aura influence strengthens team positioning flexibility in large and dynamic encounters.'
            },
            {
                title: 'Level 20',
                summary: 'Oath capstone',
                details: 'Final subclass expression delivers powerful encounter-defining effects that reinforce your oath fantasy.'
            }
        ],
        featureNotes: [
            {
                title: 'Divine Smite Conversion',
                summary: 'Turns confirmed hits into high-value burst damage.',
                details: 'Because smite is declared on hit, paladin can allocate slots efficiently and avoid wasting burst resources on missed attacks.'
            },
            {
                title: 'Aura-Centric Teamplay',
                summary: 'Positioning around your aura can reshape failure rates.',
                details: 'Good paladin play includes formation decisions that maximize ally save support while preserving frontline pressure.'
            },
            {
                title: 'Lay on Hands Utility',
                summary: 'Reliable emergency recovery independent of slots.',
                details: 'The healing pool is especially valuable for stabilizing allies when spell resources are constrained.'
            },
            {
                title: 'Spell and Smite Balance',
                summary: 'Slot budgeting is a central decision point.',
                details: 'Choosing between utility casting and burst smites determines whether you optimize for control, sustain, or elimination speed.'
            },
            {
                title: 'Oath Identity',
                summary: 'Subclass strongly alters tactical personality.',
                details: 'Different oaths shift your toolkit toward aggression, defense, control, or thematic utility leadership.'
            },
            {
                title: 'Frontline Reliability',
                summary: 'Durability and burst make paladin highly dependable.',
                details: 'Paladin remains effective in chaotic fights because core output and survivability tools are both immediately actionable.'
            }
        ]
    },
    Ranger: {
        tagline: 'A Skilled Hunter Combining Martial Combat and Nature Magic',
        primaryAbility: 'Dexterity or Strength with Wisdom',
        hitPointDie: 'd10 per Ranger level',
        saves: 'Strength and Dexterity',
        levelOneGains: [
            'Begin with martial competency and an exploration-oriented class identity that remains relevant through the campaign.',
            'Early feature and spell choices define whether you prioritize skirmish damage, control utility, or scouting value.',
            'Ranger performs best when builds are tuned to the expected encounter and terrain profile of the table.'
        ],
        coreTraits: [
            { label: 'Primary Ability', value: 'Dexterity or Strength with Wisdom' },
            { label: 'Hit Point Die', value: 'd10 per Ranger level' },
            { label: 'Saving Throws', value: 'Strength and Dexterity' },
            { label: 'Armor Training', value: 'Light armor, medium armor, shields' },
            { label: 'Weapon Proficiencies', value: 'Simple and martial weapons' },
            { label: 'Role', value: 'Skirmish damage, scouting, utility control, and flexible ranged or melee pressure' }
        ],
        levelMilestones: [
            {
                title: 'Level 2',
                summary: 'Fighting Style and Spellcasting',
                details: 'The hybrid ranger loop begins with weapon consistency plus tactical spell support for control, mobility, or precision damage.'
            },
            {
                title: 'Level 3',
                summary: 'Ranger Archetype',
                details: 'Subclass path defines your tactical lane, such as burst hunting, companion play, sustained control, or utility-heavy pressure.'
            },
            {
                title: 'Level 5',
                summary: 'Extra Attack and 2nd-tier scaling',
                details: 'Core martial throughput stabilizes and ranger begins to blend repeated attacks with stronger class spell interactions.'
            },
            {
                title: 'Level 9',
                summary: 'Spell tier expansion',
                details: 'Higher-level spell access improves control options and gives better answers for difficult encounter patterns.'
            },
            {
                title: 'Level 10',
                summary: 'Exploration identity spike',
                details: 'Mid-game ranger utility tools improve consistency in scouting, movement, and environmental problem-solving.'
            },
            {
                title: 'Level 14',
                summary: 'Subclass and utility maturity',
                details: 'Ranger toolkit reaches a balanced state where combat pressure and non-combat value remain both highly relevant.'
            },
            {
                title: 'Level 20',
                summary: 'Capstone offense profile',
                details: 'Late-game ranger reinforces dependable target pressure while preserving hybrid utility options.'
            }
        ],
        featureNotes: [
            {
                title: 'Hybrid Combat Rhythm',
                summary: 'Ranger strength is in combining weapon and spell tempo.',
                details: 'Your best turns usually layer damage with control or positioning benefits rather than focusing only on single-source output.'
            },
            {
                title: 'Subclass Influence',
                summary: 'Archetype selection strongly changes turn planning.',
                details: 'Depending on path, you may emphasize mark management, companion coordination, mobility play, or utility disruption.'
            },
            {
                title: 'Exploration Reliability',
                summary: 'Ranger remains a high-value non-combat contributor.',
                details: 'Tracking, navigation, and environment-aware tools keep ranger relevant even when combat intensity is low.'
            },
            {
                title: 'Bonus Action Pressure',
                summary: 'Action economy conflicts shape build efficiency.',
                details: 'Successful ranger play often depends on pre-planning which features compete for bonus actions in key rounds.'
            },
            {
                title: 'Target Selection Discipline',
                summary: 'Damage profile improves with smart focus fire.',
                details: 'Ranger performs best when it commits pressure to priority threats and uses utility to avoid wasted turns.'
            },
            {
                title: 'Campaign Adaptability',
                summary: 'Class can tune to many encounter environments.',
                details: 'Spell picks, style choices, and subclass tools let ranger stay useful across varied campaign structures.'
            }
        ]
    },
    Rogue: {
        tagline: 'A Precision Specialist in Positioning, Skills, and Opportunistic Damage',
        primaryAbility: 'Dexterity',
        hitPointDie: 'd8 per Rogue level',
        saves: 'Dexterity and Intelligence',
        levelOneGains: [
            'Gain Sneak Attack and Expertise at level 1, immediately combining precision damage with elite skill expression.',
            'Rogue starts with strong tactical value in both combat positioning and non-combat challenge solving.',
            'Early turns reward map awareness and ally coordination more than static stand-and-trade play.'
        ],
        coreTraits: [
            { label: 'Primary Ability', value: 'Dexterity' },
            { label: 'Hit Point Die', value: 'd8 per Rogue level' },
            { label: 'Saving Throws', value: 'Dexterity and Intelligence' },
            { label: 'Armor Training', value: 'Light armor' },
            { label: 'Weapon Proficiencies', value: 'Simple weapons, hand crossbows, longswords, rapiers, shortswords' },
            { label: 'Role', value: 'Single-target pressure, scouting, infiltration, and elite skill coverage' }
        ],
        levelMilestones: [
            {
                title: 'Level 1',
                summary: 'Sneak Attack and Expertise',
                details: 'Rogue identity is immediately active through precision burst and superior skill reliability in chosen areas.'
            },
            {
                title: 'Level 2',
                summary: 'Cunning Action',
                details: 'Bonus-action Dash, Disengage, or Hide transforms positioning flexibility and improves damage consistency over time.'
            },
            {
                title: 'Level 3',
                summary: 'Roguish Archetype',
                details: 'Subclass path determines whether you lean on control, burst, utility, mobility, or social manipulation themes.'
            },
            {
                title: 'Level 5',
                summary: 'Uncanny Dodge',
                details: 'A major durability jump that helps rogue stay active against dangerous focused attackers.'
            },
            {
                title: 'Level 7',
                summary: 'Evasion breakpoint',
                details: 'Dexterity-based survivability becomes exceptional, especially against area effects and repeated save pressure.'
            },
            {
                title: 'Level 11',
                summary: 'Reliable Talent tier',
                details: 'Skill-floor consistency spikes, reinforcing rogue leadership in critical non-combat and precision tasks.'
            },
            {
                title: 'Level 20',
                summary: 'Capstone reliability profile',
                details: 'Late-game rogue secures consistent high-value outcomes in both tactical and skill-based scenarios.'
            }
        ],
        featureNotes: [
            {
                title: 'Sneak Attack Setup',
                summary: 'Precision burst depends on positioning and target state.',
                details: 'Consistent rogue damage comes from planning engagement lanes and coordinating with allies for advantage windows.'
            },
            {
                title: 'Cunning Action Control',
                summary: 'Bonus-action mobility drives tactical safety and pressure.',
                details: 'Rogue can frequently choose favorable engagements while avoiding overcommitment through flexible reposition options.'
            },
            {
                title: 'Expertise Dominance',
                summary: 'Doubled proficiency defines out-of-combat impact.',
                details: 'Rogue often anchors stealth, social, and investigation scenes by converting moderate odds into reliable outcomes.'
            },
            {
                title: 'Defensive Layering',
                summary: 'Uncanny Dodge and Evasion smooth burst risk.',
                details: 'These tools make rogue far more resilient than expected when played with strong positioning discipline.'
            },
            {
                title: 'Subclass Expression',
                summary: 'Archetype can shift rogue far beyond a damage role.',
                details: 'Many rogue subclasses add control, utility, or social pressure that meaningfully changes party dynamics.'
            },
            {
                title: 'Target Priority Play',
                summary: 'Rogue excels at collapsing high-value targets quickly.',
                details: 'Choosing when to pressure vulnerable enemies versus playing for safety is a key strategic skill.'
            }
        ]
    },
    Sorcerer: {
        tagline: 'An Innate Arcane Caster with Metamagic Precision',
        primaryAbility: 'Charisma',
        hitPointDie: 'd6 per Sorcerer level',
        saves: 'Constitution and Charisma',
        levelOneGains: [
            'Gain spellcasting and Sorcerous Origin at level 1, establishing your innate-magic identity immediately.',
            'Early spell selection determines whether your sorcerer leans control, burst damage, or support utility.',
            'Resource economy begins tight, so efficient spell choices and concentration planning matter from the start.'
        ],
        coreTraits: [
            { label: 'Primary Ability', value: 'Charisma' },
            { label: 'Hit Point Die', value: 'd6 per Sorcerer level' },
            { label: 'Saving Throws', value: 'Constitution and Charisma' },
            { label: 'Armor Training', value: 'None by default' },
            { label: 'Weapon Proficiencies', value: 'Simple weapons' },
            { label: 'Role', value: 'Burst caster, control specialist, and spell-shape tactician' }
        ],
        levelMilestones: [
            {
                title: 'Level 1',
                summary: 'Origin features and spellcasting',
                details: 'Subclass origin sets your baseline fantasy and often provides key defensive, offensive, or utility framing from day one.'
            },
            {
                title: 'Level 2',
                summary: 'Font of Magic',
                details: 'Sorcery points introduce resource conversion decisions that define encounter pacing and flexibility.'
            },
            {
                title: 'Level 3',
                summary: 'Metamagic',
                details: 'Class identity fully matures as you begin modifying spells for speed, precision, subtlety, or target shaping.'
            },
            {
                title: 'Level 5',
                summary: '3rd-level spell impact tier',
                details: 'Core spell power increases sharply, and metamagic interactions become much more encounter-defining.'
            },
            {
                title: 'Level 10',
                summary: 'Expanded metamagic toolkit',
                details: 'Additional metamagic options widen tactical flexibility and improve adaptation across varied encounter types.'
            },
            {
                title: 'Level 17',
                summary: 'Top spell tier access',
                details: 'High-level spellcasting combined with metamagic creates some of the strongest turn-shaping potential in the game.'
            },
            {
                title: 'Level 20',
                summary: 'Sorcerous Restoration profile',
                details: 'Capstone-level pacing support improves consistency across long days where resource pressure is high.'
            }
        ],
        featureNotes: [
            {
                title: 'Metamagic Mastery',
                summary: 'Spell modification is the core class differentiator.',
                details: 'Sorcerer power comes from choosing the right metamagic mode for the moment rather than simply casting the biggest spell available.'
            },
            {
                title: 'Spell Selection Pressure',
                summary: 'Limited known spells make each pick strategic.',
                details: 'A focused spell suite with clear role intent usually outperforms broad but shallow coverage.'
            },
            {
                title: 'Origin Synergy',
                summary: 'Subclass features alter casting tempo and survivability.',
                details: 'Strong builds align origin traits with metamagic choices and preferred concentration plans.'
            },
            {
                title: 'Resource Conversion',
                summary: 'Sorcery point and slot tradeoffs shape endurance.',
                details: 'Understanding when to convert for immediate output versus future flexibility is central to high-level sorcerer play.'
            },
            {
                title: 'Concentration Uptime',
                summary: 'Many top impact spells require sustained focus.',
                details: 'Positioning and defensive planning are crucial because concentration loss can collapse an entire turn plan.'
            },
            {
                title: 'Burst Versus Control Balance',
                summary: 'Class can flex between elimination and encounter shaping.',
                details: 'The strongest sorcerers know when to spend for explosive turns and when to preserve resources for control value.'
            }
        ]
    },
    Warlock: {
        tagline: 'A Pact Caster with Strong At-Will Pressure and Customization',
        primaryAbility: 'Charisma',
        hitPointDie: 'd8 per Warlock level',
        saves: 'Wisdom and Charisma',
        levelOneGains: [
            'Gain Otherworldly Patron and Pact Magic at level 1, defining class flavor and resource rhythm immediately.',
            'Warlock starts with a small slot pool but strong slot level and frequent short-rest recovery incentives.',
            'Early turns are anchored by reliable cantrip pressure and selective high-impact spell use.'
        ],
        coreTraits: [
            { label: 'Primary Ability', value: 'Charisma' },
            { label: 'Hit Point Die', value: 'd8 per Warlock level' },
            { label: 'Saving Throws', value: 'Wisdom and Charisma' },
            { label: 'Armor Training', value: 'Light armor' },
            { label: 'Weapon Proficiencies', value: 'Simple weapons (expanded by choices/subclass)' },
            { label: 'Role', value: 'Consistent pressure caster with modular invocations and adaptable utility' }
        ],
        levelMilestones: [
            {
                title: 'Level 1',
                summary: 'Patron and Pact Magic',
                details: 'Warlock identity begins immediately through patron flavor and a unique slot economy tuned around short-rest pacing.'
            },
            {
                title: 'Level 2',
                summary: 'Eldritch Invocations',
                details: 'Invocations provide major customization and can reshape offense, utility, mobility, and social pressure patterns.'
            },
            {
                title: 'Level 3',
                summary: 'Pact Boon',
                details: 'Boon choice defines tactical style, whether you lean weapon pressure, familiar utility, or ritual-focused flexibility.'
            },
            {
                title: 'Level 5',
                summary: 'Invocation and slot maturity',
                details: 'Class pacing becomes smoother as core invocation package and repeated slot usage patterns solidify.'
            },
            {
                title: 'Level 11',
                summary: 'Mystic Arcanum tier',
                details: 'High-level one-off spell access adds strategic spikes without abandoning warlock core rhythm.'
            },
            {
                title: 'Level 17',
                summary: 'Top pact-casting cadence',
                details: 'Late-game warlock combines high slot level, invocation depth, and reliable at-will damage into steady pressure.'
            },
            {
                title: 'Level 20',
                summary: 'Eldritch Master profile',
                details: 'Capstone further improves resource pacing and supports sustained influence across long adventuring sequences.'
            }
        ],
        featureNotes: [
            {
                title: 'Short-Rest Economy',
                summary: 'Small slot pool but frequent refresh defines planning.',
                details: 'Warlock rewards tables and parties that leverage short rests; in those environments, class throughput is consistently strong.'
            },
            {
                title: 'Invocation Architecture',
                summary: 'Invocations are the core build personalization layer.',
                details: 'Your invocation package can emphasize cantrip offense, utility breadth, mobility, defenses, or social pressure.'
            },
            {
                title: 'Eldritch Blast Baseline',
                summary: 'Reliable at-will pressure stabilizes turn quality.',
                details: 'When slots are conserved, cantrip-focused turns maintain meaningful contribution without collapsing encounter impact.'
            },
            {
                title: 'Patron and Boon Synergy',
                summary: 'Two-layer class identity shapes tactical role.',
                details: 'Combining patron features with boon path creates highly varied warlock experiences across different builds.'
            },
            {
                title: 'Resource Timing',
                summary: 'Warlock gains value from selective slot commitment.',
                details: 'Choosing the right moments for high-impact pact casts is often more important than maximizing total casts per fight.'
            },
            {
                title: 'Party Interaction',
                summary: 'Class excels with coordinated setup and control.',
                details: 'Warlock pressure scales strongly when allies provide positioning control, advantage generation, or defensive cover.'
            }
        ]
    },
    Wizard: {
        tagline: 'A Scholarly Arcane Caster with Unmatched Spellbreadth',
        primaryAbility: 'Intelligence',
        hitPointDie: 'd6 per Wizard level',
        saves: 'Intelligence and Wisdom',
        levelOneGains: [
            'Gain spellbook casting and Arcane Recovery at level 1, establishing both breadth and rest-cycle efficiency early.',
            'Wizard identity centers on planning, preparation, and choosing the right answer for each encounter profile.',
            'Early game strength comes less from raw durability and more from strong control and utility problem-solving.'
        ],
        coreTraits: [
            { label: 'Primary Ability', value: 'Intelligence' },
            { label: 'Hit Point Die', value: 'd6 per Wizard level' },
            { label: 'Saving Throws', value: 'Intelligence and Wisdom' },
            { label: 'Armor Training', value: 'None by default' },
            { label: 'Weapon Proficiencies', value: 'Daggers, darts, slings, quarterstaffs, light crossbows' },
            { label: 'Role', value: 'Control, utility, ritual casting, and high-flexibility encounter shaping' }
        ],
        levelMilestones: [
            {
                title: 'Level 1',
                summary: 'Spellbook and Arcane Recovery',
                details: 'Wizard opens with broad answer potential and early resource smoothing that supports long-day consistency.'
            },
            {
                title: 'Level 2',
                summary: 'Arcane Tradition',
                details: 'Subclass specialization shapes your tactical priorities and often influences spell preparation strategy throughout the campaign.'
            },
            {
                title: 'Level 5',
                summary: '3rd-level spell breakpoint',
                details: 'A major power jump where wizard gains iconic high-impact options for control, defense, and encounter manipulation.'
            },
            {
                title: 'Level 10',
                summary: 'Tradition feature maturity',
                details: 'Subclass toolkit becomes more defined, often improving reliability, efficiency, or specialized tactical pressure.'
            },
            {
                title: 'Level 14',
                summary: 'High-tier tradition cap',
                details: 'Late subclass features can significantly change encounter approach and raise the class tactical ceiling.'
            },
            {
                title: 'Level 17',
                summary: 'Top spell tier access',
                details: 'Wizard reaches top-end arcane influence with powerful options for broad encounter control and decisive outcomes.'
            },
            {
                title: 'Level 20',
                summary: 'Signature Spell profile',
                details: 'Capstone-level efficiency supports sustained high-impact casting without exhausting critical resources too quickly.'
            }
        ],
        featureNotes: [
            {
                title: 'Spellbook Breadth',
                summary: 'Largest long-term spell catalog among core casters.',
                details: 'Wizard effectiveness scales with spell acquisition and preparation discipline, making long-term planning a major class skill.'
            },
            {
                title: 'Preparation Strategy',
                summary: 'Daily prep decisions determine encounter performance.',
                details: 'Selecting the right mix of control, defense, utility, and damage spells often matters more than raw slot count.'
            },
            {
                title: 'Arcane Recovery Pacing',
                summary: 'Short-rest recovery improves endurance planning.',
                details: 'This feature rewards measured slot spending and helps wizard maintain influence across multi-encounter days.'
            },
            {
                title: 'Tradition Identity',
                summary: 'Subclass strongly impacts tactical personality.',
                details: 'Different schools can shift wizard toward specialist control, survivability, burst optimization, or utility leadership.'
            },
            {
                title: 'Ritual Casting Value',
                summary: 'Many utility problems can be solved slot-free.',
                details: 'Ritual access preserves combat resources while keeping wizard highly relevant in exploration and social scenes.'
            },
            {
                title: 'Fragility Management',
                summary: 'Positioning and defensive planning are essential.',
                details: 'Wizard has enormous power ceiling but depends on awareness, spacing, and team coordination to avoid collapse under pressure.'
            }
        ]
    }
};

const classSubclassSnapshots: Record<string, { summary: string; details: string }> = {
    'Blood Hunter': {
        summary: 'Published orders include Ghostslayer, Lycan, Mutant, and Profane Soul.',
        details: 'Each order changes your core loop significantly, from anti-undead focus and transformation pressure to mutagen customization or pact-style spell integration.'
    },
    Barbarian: {
        summary: 'Published paths include Berserker, Totem Warrior, Zealot, Beast, Giant, and Wild Magic.',
        details: 'The class index also lists paths like Ancestral Guardian and Storm Herald. These options range from pure frontline durability to utility/control-oriented rage play.'
    },
    Bard: {
        summary: 'Published colleges include Lore, Valor, Swords, Glamour, Eloquence, Creation, Spirits, and Whispers.',
        details: 'College choice dramatically shifts your turn pattern between support leadership, martial hybrid pressure, and social/control specialization.'
    },
    Cleric: {
        summary: 'Published domains include Life, Light, Tempest, Trickery, Forge, Grave, Peace, and Twilight.',
        details: 'Domain selection strongly determines armor profile, spell package, and whether your cleric leans healing anchor, durable frontliner, or control-support hybrid.'
    },
    Druid: {
        summary: 'Published circles include Land, Moon, Shepherd, Spores, Stars, Dreams, and Wildfire.',
        details: 'Circle choice decides whether your druid emphasizes form-based durability, summoning/control depth, or spell-centric support and utility pressure.'
    },
    Fighter: {
        summary: 'Published archetypes include Champion, Battle Master, Eldritch Knight, Rune Knight, and Psi Warrior.',
        details: 'Archetype selection can make fighter play straightforward and durable or highly technical with resource-driven control and utility patterns.'
    },
    Monk: {
        summary: 'Published ways include Open Hand, Shadow, Kensei, Mercy, Astral Self, and Ascendant Dragon.',
        details: 'Monastic Tradition determines whether your monk emphasizes control, mobility aggression, support utility, or specialized weapon/spell-like expression.'
    },
    Paladin: {
        summary: 'Published oaths include Devotion, Ancients, Vengeance, Conquest, Redemption, and Watchers.',
        details: 'Oath features and expanded spells shape whether your paladin prioritizes offense, party defense, battlefield control, or anti-threat specialization.'
    },
    Ranger: {
        summary: 'Published conclaves include Hunter, Beast Master, Gloom Stalker, Horizon Walker, and Fey Wanderer.',
        details: 'Subclass path has a major impact on tempo, target access, utility profile, and whether you play as a skirmisher, controller, or companion-focused hybrid.'
    },
    Rogue: {
        summary: 'Published archetypes include Thief, Assassin, Arcane Trickster, Swashbuckler, Soulknife, and Phantom.',
        details: 'Roguish Archetype shapes role beyond Sneak Attack, from social manipulation and scouting utility to mobile dueling or psionic precision play.'
    },
    Sorcerer: {
        summary: 'Published origins include Draconic Bloodline, Wild Magic, Divine Soul, Aberrant Mind, and Clockwork Soul.',
        details: 'Origin features heavily influence survivability, spell expression, and how you pair metamagic choices with your preferred combat rhythm.'
    },
    Warlock: {
        summary: 'Published patrons include Fiend, Archfey, Great Old One, Hexblade, Genie, and Fathomless.',
        details: 'Patron and Pact Boon together define warlock identity, mixing at-will pressure with tailored utility, control, and thematic power spikes.'
    },
    Wizard: {
        summary: 'Published schools include Evocation, Abjuration, Divination, Illusion, Necromancy, and Bladesinging.',
        details: 'Arcane Tradition selection guides your tactical niche, from pure control and defensive reliability to aggressive spell shaping and mobility-enhanced casting.'
    }
};

const makeSpeciesInfo = (
    name: string,
    summary: string,
    hallmark: string,
    buildAngle: string,
    mobility: string,
    slug: string,
    speed = '30 ft'
): BuilderInfo => ({
    name,
    source: "Player's Handbook / Expanded Lineages",
    summary,
    highlights: [`Hallmark: ${hallmark}`, `Build angle: ${buildAngle}`, `Mobility profile: ${mobility}`],
    speciesDetails: {
        tagline: `${name} Lineage Overview`,
        creatureType: 'Humanoid',
        size: 'Medium or Small (lineage dependent)',
        speed,
        sourceUrl: `https://dnd5e.wikidot.com/lineage:${slug}`,
        coreTraits: [
            { label: 'Creature Type', value: 'Humanoid' },
            { label: 'Size', value: 'Medium or Small (lineage dependent)' },
            { label: 'Speed', value: speed },
            { label: 'Signature Identity', value: hallmark },
            { label: 'Build Notes', value: buildAngle }
        ],
        traitNotes: [
            {
                title: 'Lineage Identity',
                summary: hallmark,
                details: `${name} provides a distinct lineage package that affects roleplay, exploration, and tactical decisions across a full campaign.`
            },
            {
                title: 'Mobility and Survival',
                summary: mobility,
                details: `${name} movement and defensive profile can shape target access, positioning safety, and encounter pacing in both combat and travel.`
            },
            {
                title: 'Build Synergy',
                summary: buildAngle,
                details: `${name} is strongest when class and feat choices amplify its unique lineage strengths rather than overlapping them.`
            }
        ]
    }
});

const speciesCatalog: Array<{ name: string; slug: string; hallmark: string; speed?: string }> = [
    { name: 'Dragonborn', slug: 'dragonborn', hallmark: 'Breath weapon and draconic ancestry' },
    { name: 'Dwarf', slug: 'dwarf', hallmark: 'Defensive resilience and durability' },
    { name: 'Elf', slug: 'elf', hallmark: 'Keen senses and agile utility' },
    { name: 'Gnome', slug: 'gnome', hallmark: 'Cunning defense and trick utility' },
    { name: 'Half-Elf', slug: 'half-elf', hallmark: 'Adaptive social flexibility' },
    { name: 'Half-Orc', slug: 'half-orc', hallmark: 'Relentless martial momentum' },
    { name: 'Halfling', slug: 'halfling', hallmark: 'Luck-based consistency' },
    { name: 'Human', slug: 'human', hallmark: 'Broad build adaptability' },
    { name: 'Tiefling', slug: 'tiefling', hallmark: 'Fiend-touched innate magic' },
    { name: 'Aarakocra', slug: 'aarakocra', hallmark: 'Aerial positioning profile', speed: '30 ft (with flight features)' },
    { name: 'Aasimar', slug: 'aasimar', hallmark: 'Celestial-themed power' },
    { name: 'Changeling', slug: 'changeling', hallmark: 'Shapeshifting social utility' },
    { name: 'Deep Gnome', slug: 'deep-gnome', hallmark: 'Subterranean stealth resilience' },
    { name: 'Duergar', slug: 'duergar', hallmark: 'Stoic underdark durability' },
    { name: 'Eladrin', slug: 'eladrin', hallmark: 'Fey teleport expression' },
    { name: 'Fairy', slug: 'fairy', hallmark: 'Fey flight and mobility', speed: '30 ft (with flight features)' },
    { name: 'Firbolg', slug: 'firbolg', hallmark: 'Nature-giant utility profile' },
    { name: 'Genasi (Air)', slug: 'genasi-air', hallmark: 'Air-aspected mobility' },
    { name: 'Genasi (Earth)', slug: 'genasi-earth', hallmark: 'Earth-aspected toughness' },
    { name: 'Genasi (Fire)', slug: 'genasi-fire', hallmark: 'Fire-aspected pressure' },
    { name: 'Genasi (Water)', slug: 'genasi-water', hallmark: 'Water-aspected adaptability' },
    { name: 'Githyanki', slug: 'githyanki', hallmark: 'Astral martial discipline' },
    { name: 'Githzerai', slug: 'githzerai', hallmark: 'Psionic defensive focus' },
    { name: 'Goliath', slug: 'goliath', hallmark: 'Athletic endurance' },
    { name: 'Harengon', slug: 'harengon', hallmark: 'Burst reposition mobility' },
    { name: 'Kenku', slug: 'kenku', hallmark: 'Stealth and trick utility' },
    { name: 'Locathah', slug: 'locathah', hallmark: 'Aquatic survival profile' },
    { name: 'Owlin', slug: 'owlin', hallmark: 'Nocturnal aerial scouting', speed: '30 ft (with flight features)' },
    { name: 'Satyr', slug: 'satyr', hallmark: 'Fey social disruption' },
    { name: 'Sea Elf', slug: 'sea-elf', hallmark: 'Marine elven adaptability' },
    { name: 'Shadar-Kai', slug: 'shadar-kai', hallmark: 'Shadowfell repositioning' },
    { name: 'Tabaxi', slug: 'tabaxi', hallmark: 'Sprint and scouting mobility' },
    { name: 'Tortle', slug: 'tortle', hallmark: 'Natural shell defense' },
    { name: 'Triton', slug: 'triton', hallmark: 'Sea-guardian utility' },
    { name: 'Verdan', slug: 'verdan', hallmark: 'Adaptive growth traits' },
    { name: 'Bugbear', slug: 'bugbear', hallmark: 'Ambush pressure profile' },
    { name: 'Centaur', slug: 'centaur', hallmark: 'Charge-oriented movement', speed: '40 ft' },
    { name: 'Goblin', slug: 'goblin', hallmark: 'Nimble skirmish utility' },
    { name: 'Grung', slug: 'grung', hallmark: 'Amphibious poison identity' },
    { name: 'Hobgoblin', slug: 'hobgoblin', hallmark: 'Coordinated martial discipline' },
    { name: 'Kobold', slug: 'kobold', hallmark: 'Pack-style trickster play' },
    { name: 'Lizardfolk', slug: 'lizardfolk', hallmark: 'Primal survival durability' },
    { name: 'Minotaur', slug: 'minotaur', hallmark: 'Heavy melee momentum' },
    { name: 'Orc', slug: 'orc', hallmark: 'Aggressive frontline cadence' },
    { name: 'Shifter', slug: 'shifter', hallmark: 'Transformation combat windows' },
    { name: 'Yuan-Ti', slug: 'yuan-ti', hallmark: 'Serpentine mystical resilience' }
];

const speciesInfoMap: Record<string, BuilderInfo> = Object.fromEntries(
    speciesCatalog.map((species) => [
        species.name,
        makeSpeciesInfo(
            species.name,
            `${species.name} lineage with a ${species.hallmark.toLowerCase()} focus.`,
            species.hallmark,
            'Supports multiple class archetypes.',
            'See lineage reference for exact movement and feature rules.',
            species.slug,
            species.speed ?? '30 ft'
        )
    ])
) as Record<string, BuilderInfo>;

const backgroundDetailOverrides: Record<string, Omit<BackgroundDetail, 'sourceUrl'>> = {
    Acolyte: {
        description: 'You served in a temple or sacred order, acting as an intermediary between the divine and the mortal world through rites, devotion, and study.',
        skillProficiencies: 'Insight, Religion',
        toolProficiencies: 'Calligrapher\'s supplies',
        languages: 'Two of your choice',
        choices: [
            {
                key: 'magic-initiate-ability',
                title: 'Magic Initiate',
                subtitle: 'Granted Feat · 1 Choice',
                description: 'Choose your spellcasting ability for this background feat.',
                options: ['Intelligence', 'Wisdom', 'Charisma']
            },
            {
                key: 'ability-scores',
                title: 'Ability Scores',
                subtitle: '1 Choice',
                description: 'Choose how this background applies ability score increases.',
                options: ['Increase three scores (+1 / +1 / +1)', 'Increase two scores (+2 / +1)']
            },
            {
                key: 'acolyte-feature',
                title: 'Shelter of the Faithful',
                subtitle: 'Background Feature',
                description: 'Choose the temple tie that best matches your character story.',
                options: ['Temple Residence', 'Traveling Missionary', 'Pilgrim with Regional Support']
            }
        ]
    },
    Criminal: {
        description: 'You survived by working in the underworld, developing illicit contacts and practical methods for theft, deception, and evasion.',
        skillProficiencies: 'Stealth, Sleight of Hand',
        toolProficiencies: 'Thieves\' Tools',
        languages: 'None',
        choices: [
            {
                key: 'criminal-specialty',
                title: 'Criminal Specialty',
                subtitle: '1 Choice',
                description: 'Select your preferred underworld specialty.',
                options: ['Blackmailer', 'Burglar', 'Enforcer', 'Fence', 'Highway Robber', 'Hired Killer', 'Pickpocket', 'Smuggler']
            },
            {
                key: 'ability-scores',
                title: 'Ability Scores',
                subtitle: '1 Choice',
                description: 'Choose how this background applies ability score increases.',
                options: ['Increase three scores (+1 / +1 / +1)', 'Increase two scores (+2 / +1)']
            },
            {
                key: 'criminal-contact',
                title: 'Criminal Contact',
                subtitle: 'Background Feature',
                description: 'Choose the kind of contact network your character relies on.',
                options: ['Thieves\' Guild Liaison', 'Corrupt Messenger Ring', 'Smuggling Caravan Route']
            }
        ]
    },
    Noble: {
        description: 'You come from a family with title, wealth, and political influence, and your background is tied to obligations, reputation, and social privilege.',
        skillProficiencies: 'History, Persuasion',
        toolProficiencies: 'One type of gaming set',
        languages: 'One of your choice',
        choices: [
            {
                key: 'gaming-set',
                title: 'Gaming Set',
                subtitle: 'Choose 1 type',
                options: ['Dice Set', 'Dragonchess', 'Playing Cards', 'Three-Dragon Ante']
            },
            {
                key: 'language',
                title: 'Languages',
                subtitle: 'Background Language',
                options: ['Elvish', 'Dwarvish', 'Draconic', 'Sylvan', 'Infernal', 'Celestial']
            },
            {
                key: 'noble-feature',
                title: 'Position of Privilege',
                subtitle: 'Background Feature',
                description: 'Select the social angle your noble status emphasizes.',
                options: ['Court Access', 'Regional Influence', 'Retainers Variant (Knight)']
            },
            {
                key: 'ability-scores',
                title: 'Ability Scores',
                subtitle: '1 Choice',
                options: ['Increase three scores (+1 / +1 / +1)', 'Increase two scores (+2 / +1)']
            }
        ]
    }
};

@Component({
    selector: 'app-new-character-standard-page',
    imports: [CommonModule, RouterLink],
    templateUrl: './new-character-standard-page.component.html',
    styleUrl: './new-character-standard-page.component.scss'
})
export class NewCharacterStandardPageComponent {
    readonly Object = Object;
    readonly store = inject(DungeonStoreService);
    private readonly route = inject(ActivatedRoute);

    private readonly routeStep = toSignal(
        this.route.paramMap.pipe(map((params) => params.get('step') as StandardStep | null)),
        { initialValue: null }
    );

    readonly activeStandardStep = computed<StandardStep>(() => {
        const step = this.routeStep();
        return step && validSteps.has(step) ? step : 'home';
    });

    readonly activeInfoModal = signal<ActiveInfoModal | null>(null);
    readonly selectedClass = signal<string>('');
    readonly characterLevel = signal<number>(1);
    readonly multiclassList = signal<Record<string, number>>({});
    readonly selectedBackgroundName = signal<string>('');
    readonly selectedBackgroundUrl = signal<string>('');
    readonly classFeatureSelections = signal<Record<string, string[]>>({});
    readonly backgroundChoiceSelections = signal<Record<string, string>>({});
    readonly selectedAbilityMethod = signal<AbilityGenerationMethod>('');
    readonly abilityBaseScores = signal<Record<string, number>>({
        Strength: 10,
        Dexterity: 10,
        Constitution: 10,
        Intelligence: 10,
        Wisdom: 10,
        Charisma: 10
    });
    readonly abilityOtherModifiers = signal<Record<string, number | null>>({
        Strength: null, Dexterity: null, Constitution: null,
        Intelligence: null, Wisdom: null, Charisma: null
    });
    readonly abilityOverrideScores = signal<Record<string, number | null>>({
        Strength: null, Dexterity: null, Constitution: null,
        Intelligence: null, Wisdom: null, Charisma: null
    });
    readonly standardArraySelections = signal<Record<string, number | null>>({
        Strength: null,
        Dexterity: null,
        Constitution: null,
        Intelligence: null,
        Wisdom: null,
        Charisma: null
    });
    readonly rolledValues = signal<Array<number | null>>([null, null, null, null, null, null]);
    readonly rolledAssignments = signal<Record<number, string>>({});
    readonly manualRollGroupCount = signal(1);
    readonly diceRollGroupOpen = signal(true);
    readonly showExtendedInfo = signal(false);
    readonly expandedMilestoneIndexes = signal<Set<number>>(new Set<number>());
    readonly expandedFeatureNoteIndexes = signal<Set<number>>(new Set<number>());

    readonly standardSteps: ReadonlyArray<{ key: StandardStep; label: string }> = [
        { key: 'home', label: 'Home' },
        { key: 'class', label: '1. Class' },
        { key: 'background', label: '2. Background' },
        { key: 'species', label: '3. Species' },
        { key: 'abilities', label: '4. Abilities' },
        { key: 'equipment', label: '5. Equipment' },
        { key: 'whats-next', label: "What's Next" }
    ];

    readonly classOptions = ['Barbarian', 'Blood Hunter', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard'];
    readonly backgroundOptions: ReadonlyArray<{ name: string; url: string }> = [
        { name: 'Acolyte', url: 'https://dnd5e.wikidot.com/background:acolyte' },
        { name: 'Anthropologist', url: 'https://dnd5e.wikidot.com/background:anthropologist' },
        { name: 'Archaeologist', url: 'https://dnd5e.wikidot.com/background:archaeologist' },
        { name: 'Athlete', url: 'https://dnd5e.wikidot.com/background:athlete' },
        { name: 'Charlatan', url: 'https://dnd5e.wikidot.com/background:charlatan' },
        { name: 'City Watch', url: 'https://dnd5e.wikidot.com/background:city-watch' },
        { name: 'Clan Crafter', url: 'https://dnd5e.wikidot.com/background:clan-crafter' },
        { name: 'Cloistered Scholar', url: 'https://dnd5e.wikidot.com/background:cloistered-scholar' },
        { name: 'Courtier', url: 'https://dnd5e.wikidot.com/background:courtier' },
        { name: 'Criminal', url: 'https://dnd5e.wikidot.com/background:criminal' },
        { name: 'Entertainer', url: 'https://dnd5e.wikidot.com/background:entertainer' },
        { name: 'Faceless', url: 'https://dnd5e.wikidot.com/background:faceless' },
        { name: 'Faction Agent', url: 'https://dnd5e.wikidot.com/background:faction-agent' },
        { name: 'Far Traveler', url: 'https://dnd5e.wikidot.com/background:far-traveler' },
        { name: 'Feylost', url: 'https://dnd5e.wikidot.com/background:feylost' },
        { name: 'Fisher', url: 'https://dnd5e.wikidot.com/background:fisher' },
        { name: 'Folk Hero', url: 'https://dnd5e.wikidot.com/background:folk-hero' },
        { name: 'Giant Foundling', url: 'https://dnd5e.wikidot.com/background:giant-foundling' },
        { name: 'Gladiator', url: 'https://dnd5e.wikidot.com/background:gladiator' },
        { name: 'Guild Artisan', url: 'https://dnd5e.wikidot.com/background:guild-artisan' },
        { name: 'Guild Merchant', url: 'https://dnd5e.wikidot.com/background:guild-merchant' },
        { name: 'Haunted One', url: 'https://dnd5e.wikidot.com/background:haunted-one' },
        { name: 'Hermit', url: 'https://dnd5e.wikidot.com/background:hermit' },
        { name: 'House Agent', url: 'https://dnd5e.wikidot.com/background:house-agent' },
        { name: 'Inheritor', url: 'https://dnd5e.wikidot.com/background:inheritor' },
        { name: 'Investigator (SCAG)', url: 'https://dnd5e.wikidot.com/background:investigator-scag' },
        { name: 'Investigator (VRGR)', url: 'https://dnd5e.wikidot.com/background:investigator-vrgr' },
        { name: 'Knight', url: 'https://dnd5e.wikidot.com/background:knight' },
        { name: 'Knight of the Order', url: 'https://dnd5e.wikidot.com/background:knight-of-the-order' },
        { name: 'Marine', url: 'https://dnd5e.wikidot.com/background:marine' },
        { name: 'Mercenary Veteran', url: 'https://dnd5e.wikidot.com/background:mercenary-veteran' },
        { name: 'Noble', url: 'https://dnd5e.wikidot.com/background:noble' },
        { name: 'Outlander', url: 'https://dnd5e.wikidot.com/background:outlander' },
        { name: 'Pirate', url: 'https://dnd5e.wikidot.com/background:pirate' },
        { name: 'Rewarded', url: 'https://dnd5e.wikidot.com/background:rewarded' },
        { name: 'Ruined', url: 'https://dnd5e.wikidot.com/background:ruined' },
        { name: 'Rune Carver', url: 'https://dnd5e.wikidot.com/background:rune-carver' },
        { name: 'Sage', url: 'https://dnd5e.wikidot.com/background:sage' },
        { name: 'Sailor', url: 'https://dnd5e.wikidot.com/background:sailor' },
        { name: 'Shipwright', url: 'https://dnd5e.wikidot.com/background:shipwright' },
        { name: 'Smuggler', url: 'https://dnd5e.wikidot.com/background:smuggler' },
        { name: 'Soldier', url: 'https://dnd5e.wikidot.com/background:soldier' },
        { name: 'Spy', url: 'https://dnd5e.wikidot.com/background:spy' },
        { name: 'Urban Bounty Hunter', url: 'https://dnd5e.wikidot.com/background:urban-bounty-hunter' },
        { name: 'Urchin', url: 'https://dnd5e.wikidot.com/background:urchin' },
        { name: 'Uthgardt Tribe Member', url: 'https://dnd5e.wikidot.com/background:uthgardt-tribe-member' },
        { name: 'Waterdhavian Noble', url: 'https://dnd5e.wikidot.com/background:waterdhavian-noble' },
        { name: 'Witchlight Hand', url: 'https://dnd5e.wikidot.com/background:witchlight-hand' },
        { name: 'Black Fist Double Agent', url: 'https://dnd5e.wikidot.com/background:black-fist-double-agent' },
        { name: 'Dragon Casualty', url: 'https://dnd5e.wikidot.com/background:dragon-casualty' },
        { name: 'Iron Route Bandit', url: 'https://dnd5e.wikidot.com/background:iron-route-bandit' },
        { name: 'Phlan Insurgent', url: 'https://dnd5e.wikidot.com/background:phlan-insurgent' },
        { name: 'Stojanow Prisoner', url: 'https://dnd5e.wikidot.com/background:stojanow-prisoner' },
        { name: 'Ticklebelly Nomad', url: 'https://dnd5e.wikidot.com/background:ticklebelly-nomad' },
        { name: 'Caravan Specialist', url: 'https://dnd5e.wikidot.com/background:caravan-specialist' },
        { name: 'Earthspur Miner', url: 'https://dnd5e.wikidot.com/background:earthspur-miner' },
        { name: 'Harborfolk', url: 'https://dnd5e.wikidot.com/background:harborfolk' },
        { name: 'Mulmaster Aristocrat', url: 'https://dnd5e.wikidot.com/background:mulmaster-aristocrat' },
        { name: 'Phlan Refugee', url: 'https://dnd5e.wikidot.com/background:phlan-refugee' },
        { name: 'Cormanthor Refugee', url: 'https://dnd5e.wikidot.com/background:cormanthor-refugee' },
        { name: 'Gate Urchin', url: 'https://dnd5e.wikidot.com/background:gate-urchin' },
        { name: 'Hillsfar Merchant', url: 'https://dnd5e.wikidot.com/background:hillsfar-merchant' },
        { name: 'Hillsfar Smuggler', url: 'https://dnd5e.wikidot.com/background:hillsfar-smuggler' },
        { name: 'Secret Identity', url: 'https://dnd5e.wikidot.com/background:secret-identity' },
        { name: 'Shade Fanatic', url: 'https://dnd5e.wikidot.com/background:shade-fanatic' },
        { name: 'Trade Sheriff', url: 'https://dnd5e.wikidot.com/background:trade-sheriff' },
        { name: "Celebrity Adventurer's Scion", url: 'https://dnd5e.wikidot.com/background:celebrity-adventurers-scion' },
        { name: 'Failed Merchant', url: 'https://dnd5e.wikidot.com/background:failed-merchant' },
        { name: 'Gambler', url: 'https://dnd5e.wikidot.com/background:gambler' },
        { name: 'Plaintiff', url: 'https://dnd5e.wikidot.com/background:plaintiff' },
        { name: 'Rival Intern', url: 'https://dnd5e.wikidot.com/background:rival-intern' },
        { name: 'Dissenter', url: 'https://dnd5e.wikidot.com/background:dissenter' },
        { name: 'Initiate', url: 'https://dnd5e.wikidot.com/background:initiate' },
        { name: 'Vizier', url: 'https://dnd5e.wikidot.com/background:vizier' },
        { name: 'Knight of Solamnia', url: 'https://dnd5e.wikidot.com/background:knight-of-solamnia' },
        { name: 'Mage of High Sorcery', url: 'https://dnd5e.wikidot.com/background:mage-of-high-sorcery' },
        { name: 'Inquisitor', url: 'https://dnd5e.wikidot.com/background:inquisitor' },
        { name: 'Gate Warden', url: 'https://dnd5e.wikidot.com/background:gate-warden' },
        { name: 'Planar Philosopher', url: 'https://dnd5e.wikidot.com/background:planar-philosopher' },
        { name: 'Azorius Functionary', url: 'https://dnd5e.wikidot.com/background:azorius-functionary' },
        { name: 'Boros Legionnaire', url: 'https://dnd5e.wikidot.com/background:boros-legionnaire' },
        { name: 'Dimir Operative', url: 'https://dnd5e.wikidot.com/background:dimir-operative' },
        { name: 'Golgari Agent', url: 'https://dnd5e.wikidot.com/background:golgari-agent' },
        { name: 'Gruul Anarch', url: 'https://dnd5e.wikidot.com/background:gruul-anarch' },
        { name: 'Izzet Engineer', url: 'https://dnd5e.wikidot.com/background:izzet-engineer' },
        { name: 'Orzhov Representative', url: 'https://dnd5e.wikidot.com/background:orzhov-representative' },
        { name: 'Rakdos Cultist', url: 'https://dnd5e.wikidot.com/background:rakdos-cultist' },
        { name: 'Selesnya Initiate', url: 'https://dnd5e.wikidot.com/background:selesnya-initiate' },
        { name: 'Simic Scientist', url: 'https://dnd5e.wikidot.com/background:simic-scientist' },
        { name: 'Lorehold Student', url: 'https://dnd5e.wikidot.com/background:lorehold-student' },
        { name: 'Prismari Student', url: 'https://dnd5e.wikidot.com/background:prismari-student' },
        { name: 'Quandrix Student', url: 'https://dnd5e.wikidot.com/background:quandrix-student' },
        { name: 'Silverquill Student', url: 'https://dnd5e.wikidot.com/background:silverquill-student' },
        { name: 'Witherbloom Student', url: 'https://dnd5e.wikidot.com/background:witherbloom-student' },
        { name: 'Grinner', url: 'https://dnd5e.wikidot.com/background:grinner' },
        { name: 'Volstrucker Agent', url: 'https://dnd5e.wikidot.com/background:volstrucker-agent' },
        { name: 'Astral Drifter', url: 'https://dnd5e.wikidot.com/background:astral-drifter' },
        { name: 'Wildspacer', url: 'https://dnd5e.wikidot.com/background:wildspacer' },
        { name: 'Ashari', url: 'https://dnd5e.wikidot.com/background:ashari' }
    ];
    readonly speciesOptions = [
        'Dragonborn', 'Dwarf', 'Elf', 'Gnome', 'Half-Elf', 'Half-Orc', 'Halfling', 'Human', 'Tiefling',
        'Aarakocra', 'Aasimar', 'Changeling', 'Deep Gnome', 'Duergar', 'Eladrin', 'Fairy', 'Firbolg',
        'Genasi (Air)', 'Genasi (Earth)', 'Genasi (Fire)', 'Genasi (Water)', 'Githyanki', 'Githzerai',
        'Goliath', 'Harengon', 'Kenku', 'Locathah', 'Owlin', 'Satyr', 'Sea Elf', 'Shadar-Kai', 'Tabaxi',
        'Tortle', 'Triton', 'Verdan',
        'Bugbear', 'Centaur', 'Goblin', 'Grung', 'Hobgoblin', 'Kobold', 'Lizardfolk', 'Minotaur', 'Orc', 'Shifter', 'Yuan-Ti'
    ];
    readonly abilityTiles = ['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma'];
    readonly abilityAbbreviations: Record<string, string> = {
        Strength: 'STR',
        Dexterity: 'DEX',
        Constitution: 'CON',
        Intelligence: 'INT',
        Wisdom: 'WIS',
        Charisma: 'CHA'
    };
    readonly abilityMethods: ReadonlyArray<{ value: AbilityGenerationMethod; label: string }> = [
        { value: '', label: '-- Choose a Generation Method --' },
        { value: 'standard-array', label: 'Standard Array' },
        { value: 'manual-rolled', label: 'Manual/Rolled' },
        { value: 'point-buy', label: 'Point Buy' }
    ];
    readonly standardArrayValues: ReadonlyArray<number> = [15, 14, 13, 12, 10, 8];
    readonly pointBuyValues: ReadonlyArray<number> = [8, 9, 10, 11, 12, 13, 14, 15];
    readonly pointBuyBudget = 27;
    readonly equipmentSources = equipmentSourceLinks;
    readonly equipmentSearchTerm = signal('');
    readonly selectedEquipmentSourceUrl = signal('');
    readonly selectedClassStartingOption = signal<'A' | 'B' | ''>('A');
    readonly selectedBackgroundStartingOption = signal<'A' | 'B' | ''>('A');
    readonly inventoryEntries = signal<InventoryEntry[]>([]);
    readonly currency = signal<CurrencyState>({ pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 });

    readonly filteredEquipmentItems = computed(() => {
        const term = this.equipmentSearchTerm().trim().toLowerCase();
        const selectedSourceUrl = this.selectedEquipmentSourceUrl();

        return equipmentCatalog.filter((item) => {
            const sourceMatches = selectedSourceUrl ? item.sourceUrl === selectedSourceUrl : true;
            const termMatches = term
                ? item.name.toLowerCase().includes(term) || item.category.toLowerCase().includes(term)
                : true;
            return sourceMatches && termMatches;
        });
    });

    readonly inventoryItemCount = computed(() => this.inventoryEntries().reduce((total, entry) => total + entry.quantity, 0));
    readonly totalCurrencyInGp = computed(() => {
        const value = this.currency();
        return (value.pp * 10) + value.gp + (value.ep * 0.5) + (value.sp * 0.1) + (value.cp * 0.01);
    });

    readonly selectedBackground = computed(() => {
        const selectedUrl = this.selectedBackgroundUrl();
        if (!selectedUrl) {
            return null;
        }

        return this.backgroundOptions.find((background) => background.url === selectedUrl) ?? null;
    });

    readonly selectedBackgroundDetail = computed<BackgroundDetail | null>(() => {
        const selected = this.selectedBackground();
        if (!selected) {
            return null;
        }

        const override = backgroundDetailOverrides[selected.name];
        if (override) {
            return { ...override, sourceUrl: selected.url };
        }

        return {
            description: `${selected.name} has source-specific rules and roleplay flavor. Use the source link to review the complete rules text and optional variants for your table.`,
            skillProficiencies: 'See source entry',
            toolProficiencies: 'See source entry',
            languages: 'See source entry',
            choices: [
                {
                    key: 'ability-scores',
                    title: 'Ability Scores',
                    subtitle: '1 Choice',
                    options: ['Increase three scores (+1 / +1 / +1)', 'Increase two scores (+2 / +1)']
                },
                {
                    key: 'background-feature',
                    title: 'Background Feature',
                    subtitle: `${selected.name} feature`,
                    description: 'Choose how your background feature most often appears in play.',
                    options: ['Social Access', 'Travel/Exploration Utility', 'Downtime Advantage']
                },
                {
                    key: 'characteristics-focus',
                    title: 'Suggested Characteristics',
                    subtitle: 'Traits, Ideals, Bonds, Flaws',
                    options: ['Roleplay Flavor Focus', 'Party Utility Focus', 'Story Hook Focus']
                }
            ],
            sourceUrl: selected.url
        };
    });

    readonly pointBuySpent = computed(() => {
        if (this.selectedAbilityMethod() !== 'point-buy') {
            return 0;
        }

        return this.abilityTiles.reduce((total, ability) => {
            const score = this.abilityBaseScores()[ability] ?? 8;
            return total + this.getPointBuyCost(score);
        }, 0);
    });

    readonly pointBuyRemaining = computed(() => this.pointBuyBudget - this.pointBuySpent());

    openClassModal(className: string): void {
        const info = classInfoMap[className];
        if (!info) {
            return;
        }

        const fallbackDetails = classDetailFallbacks[className];
        const details = info.details ?? fallbackDetails;

        if (!details) {
            this.activeInfoModal.set({ type: 'class', info });
            this.showExtendedInfo.set(false);
            this.expandedMilestoneIndexes.set(new Set<number>());
            this.expandedFeatureNoteIndexes.set(new Set<number>());
            return;
        }

        const subclassSnapshot = classSubclassSnapshots[className];
        const baseFeatureNotes = details.featureNotes.map((note) => ({ ...note }));
        const hasSnapshotNote = baseFeatureNotes.some((note) => note.title === 'Published Subclass Snapshot');

        if (subclassSnapshot && !hasSnapshotNote) {
            baseFeatureNotes.push({
                title: 'Published Subclass Snapshot',
                summary: subclassSnapshot.summary,
                details: subclassSnapshot.details
            });
        }

        const enrichedInfo: BuilderInfo = {
            ...info,
            details: {
                ...details,
                levelOneGains: [...details.levelOneGains],
                coreTraits: details.coreTraits.map((trait) => ({ ...trait })),
                levelMilestones: details.levelMilestones.map((milestone) => ({ ...milestone })),
                featureNotes: baseFeatureNotes
            }
        };

        this.activeInfoModal.set({ type: 'class', info: enrichedInfo });
        this.showExtendedInfo.set(false);
        this.expandedMilestoneIndexes.set(new Set<number>());
        this.expandedFeatureNoteIndexes.set(new Set<number>());
    }

    openSpeciesModal(speciesName: string): void {
        const info = speciesInfoMap[speciesName];
        if (!info) {
            return;
        }

        this.activeInfoModal.set({ type: 'species', info });
        this.showExtendedInfo.set(false);
        this.expandedMilestoneIndexes.set(new Set<number>());
        this.expandedFeatureNoteIndexes.set(new Set<number>());
    }

    closeInfoModal(): void {
        this.activeInfoModal.set(null);
        this.showExtendedInfo.set(false);
        this.expandedMilestoneIndexes.set(new Set<number>());
        this.expandedFeatureNoteIndexes.set(new Set<number>());
    }

    selectClass(className: string): void {
        const current = this.multiclassList();
        this.multiclassList.set({
            ...current,
            [className]: 1
        });
        this.selectedClass.set('');
        this.closeInfoModal();
    }

    selectBackground(backgroundName: string): void {
        this.selectedBackgroundName.set(backgroundName);
        this.closeInfoModal();
    }

    toggleExtendedInfo(): void {
        this.showExtendedInfo.update((value) => !value);
    }

    updateClassFeatureSelection(featureName: string, chosenValues: string[]): void {
        this.classFeatureSelections.update((current) => ({
            ...current,
            [featureName]: chosenValues
        }));
    }

    onFeatureChoiceChange(featureName: string, option: string, isChecked: boolean, maxChoices: number): void {
        this.classFeatureSelections.update((current) => {
            const currentSelections = current[featureName] || [];
            if (isChecked) {
                // Add option if not at limit
                if (currentSelections.length < maxChoices) {
                    return { ...current, [featureName]: [...currentSelections, option] };
                }
            } else {
                // Remove option
                return { ...current, [featureName]: currentSelections.filter((s: string) => s !== option) };
            }
            return current;
        });
    }

    getClassFeatures(className: string, maxLevel: number = 1): ClassFeaturesForLevel[] {
        const seededFeatures = classLevelOneFeatures[className] || [];
        const hasSeededProgression = seededFeatures.some((featureGroup) => featureGroup.level > 1);

        if (hasSeededProgression) {
            return [...seededFeatures]
                .sort((a, b) => a.level - b.level)
                .filter((featureLevel) => featureLevel.level <= maxLevel);
        }

        const milestoneFeatures = this.getClassFeaturesFromMilestones(className);
        const mergedByLevel = new Map<number, ClassFeature[]>();

        for (const featureGroup of [...seededFeatures, ...milestoneFeatures]) {
            const current = mergedByLevel.get(featureGroup.level) || [];
            for (const feature of featureGroup.features) {
                const exists = current.some((entry) => entry.name.toLowerCase() === feature.name.toLowerCase());
                if (!exists) {
                    current.push(feature);
                }
            }
            mergedByLevel.set(featureGroup.level, current);
        }

        return Array.from(mergedByLevel.entries())
            .map(([level, features]) => ({ level, features }))
            .sort((a, b) => a.level - b.level)
            .filter((featureLevel) => featureLevel.level <= maxLevel);
    }

    private getClassFeaturesFromMilestones(className: string): ClassFeaturesForLevel[] {
        const details = classInfoMap[className]?.details ?? classDetailFallbacks[className];
        if (!details?.levelMilestones?.length) {
            return [];
        }

        return details.levelMilestones
            .map((milestone) => {
                const level = this.extractMilestoneLevel(milestone.title);
                if (!level) {
                    return null;
                }

                return {
                    level,
                    features: [{
                        name: milestone.summary,
                        level,
                        description: milestone.details
                    }]
                } as ClassFeaturesForLevel;
            })
            .filter((value): value is ClassFeaturesForLevel => value !== null);
    }

    private extractMilestoneLevel(title: string): number | null {
        const levelMatch = title.match(/level\s*(\d+)/i);
        if (levelMatch) {
            return Number(levelMatch[1]);
        }

        const rangedMatch = title.match(/(\d+)\s*[-–]\s*(\d+)/);
        if (rangedMatch) {
            return Number(rangedMatch[1]);
        }

        return null;
    }

    addClass(className: string, level: number): void {
        const current = this.multiclassList();
        this.multiclassList.set({
            ...current,
            [className]: level
        });
        this.selectedClass.set('');
        this.characterLevel.set(1);
    }

    removeClass(className: string): void {
        const current = this.multiclassList();
        const updated = { ...current };
        delete updated[className];
        this.multiclassList.set(updated);
    }

    updateClassLevel(className: string, level: number): void {
        const current = this.multiclassList();
        current[className] = level;
        this.multiclassList.set({ ...current });
    }

    startMulticlass(): void {
        this.selectedClass.set('__MULTICLASS_SELECTOR__');
    }

    toggleMilestone(index: number): void {
        const next = new Set(this.expandedMilestoneIndexes());
        if (next.has(index)) {
            next.delete(index);
        } else {
            next.add(index);
        }
        this.expandedMilestoneIndexes.set(next);
    }

    toggleFeatureNote(index: number): void {
        const next = new Set(this.expandedFeatureNoteIndexes());
        if (next.has(index)) {
            next.delete(index);
        } else {
            next.add(index);
        }
        this.expandedFeatureNoteIndexes.set(next);
    }

    isMilestoneExpanded(index: number): boolean {
        return this.expandedMilestoneIndexes().has(index);
    }

    isFeatureNoteExpanded(index: number): boolean {
        return this.expandedFeatureNoteIndexes().has(index);
    }

    visibleMilestoneCount(total: number): number {
        return this.showExtendedInfo() ? total : Math.min(6, total);
    }

    visibleFeatureNoteCount(total: number): number {
        return this.showExtendedInfo() ? total : Math.min(4, total);
    }

    onBackgroundSelected(url: string): void {
        this.selectedBackgroundUrl.set(url);
        this.backgroundChoiceSelections.set({});
    }

    getBackgroundChoiceSelection(choiceKey: string): string {
        const selected = this.selectedBackground();
        if (!selected) {
            return '';
        }

        const compositeKey = `${selected.name}:${choiceKey}`;
        return this.backgroundChoiceSelections()[compositeKey] ?? '';
    }

    onBackgroundChoiceSelected(choiceKey: string, value: string): void {
        const selected = this.selectedBackground();
        if (!selected) {
            return;
        }

        const compositeKey = `${selected.name}:${choiceKey}`;
        this.backgroundChoiceSelections.update((current) => ({
            ...current,
            [compositeKey]: value
        }));
    }

    onEquipmentSearchChanged(value: string): void {
        this.equipmentSearchTerm.set(value);
    }

    onEquipmentSourceSelected(url: string): void {
        this.selectedEquipmentSourceUrl.update((current) => (current === url ? '' : url));
    }

    onClassStartingOptionChanged(value: string): void {
        this.selectedClassStartingOption.set((value === 'A' || value === 'B') ? value : '');
    }

    onBackgroundStartingOptionChanged(value: string): void {
        this.selectedBackgroundStartingOption.set((value === 'A' || value === 'B') ? value : '');
    }

    canAddStartingEquipment(): boolean {
        return this.selectedClassStartingOption() !== '' && this.selectedBackgroundStartingOption() !== '';
    }

    addStartingEquipment(): void {
        if (!this.canAddStartingEquipment()) {
            return;
        }

        const classKey = this.selectedClassStartingOption() as 'A' | 'B';
        const backgroundKey = this.selectedBackgroundStartingOption() as 'A' | 'B';
        const classPackage = classStartingPackages[classKey];
        const backgroundPackage = backgroundStartingPackages[backgroundKey];

        classPackage.items.forEach((item) => this.addInventoryItem(item));
        backgroundPackage.items.forEach((item) => this.addInventoryItem(item));

        this.addCurrency('gp', classPackage.currency.gp ?? 0);
        this.addCurrency('gp', backgroundPackage.currency.gp ?? 0);
    }

    clearEquipmentSelections(): void {
        this.inventoryEntries.set([]);
        this.currency.set({ pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 });
    }

    addEquipmentItemToInventory(item: EquipmentItem): void {
        this.addInventoryItem({
            name: item.name,
            category: item.category,
            quantity: 1,
            sourceUrl: item.sourceUrl
        });
    }

    onCurrencyInputChanged(key: keyof CurrencyState, value: string): void {
        const parsed = Number.parseInt(value, 10);
        const safeValue = Number.isNaN(parsed) ? 0 : Math.max(0, parsed);
        this.currency.update((current) => ({ ...current, [key]: safeValue }));
    }

    private addInventoryItem(item: InventoryEntry): void {
        this.inventoryEntries.update((entries) => {
            const index = entries.findIndex((entry) => entry.name === item.name);
            if (index === -1) {
                return [...entries, { ...item }];
            }

            const next = [...entries];
            next[index] = {
                ...next[index],
                quantity: next[index].quantity + item.quantity
            };
            return next;
        });
    }

    private addCurrency(key: keyof CurrencyState, amount: number): void {
        if (amount <= 0) {
            return;
        }
        this.currency.update((current) => ({ ...current, [key]: current[key] + amount }));
    }

    onAbilityMethodSelected(method: AbilityGenerationMethod): void {
        this.selectedAbilityMethod.set(method);
        const nullRecord = { Strength: null, Dexterity: null, Constitution: null, Intelligence: null, Wisdom: null, Charisma: null };
        this.abilityOtherModifiers.set({ ...nullRecord });
        this.abilityOverrideScores.set({ ...nullRecord });

        if (method === 'standard-array') {
            this.standardArraySelections.set({
                Strength: null,
                Dexterity: null,
                Constitution: null,
                Intelligence: null,
                Wisdom: null,
                Charisma: null
            });
            this.abilityBaseScores.set({
                Strength: 0,
                Dexterity: 0,
                Constitution: 0,
                Intelligence: 0,
                Wisdom: 0,
                Charisma: 0
            });
            return;
        }

        if (method === 'point-buy') {
            this.abilityBaseScores.set({
                Strength: 8,
                Dexterity: 8,
                Constitution: 8,
                Intelligence: 8,
                Wisdom: 8,
                Charisma: 8
            });
            return;
        }

        if (method === 'manual-rolled') {
            this.abilityBaseScores.set({
                Strength: 0,
                Dexterity: 0,
                Constitution: 0,
                Intelligence: 0,
                Wisdom: 0,
                Charisma: 0
            });
            this.rolledValues.set([null, null, null, null, null, null]);
            this.rolledAssignments.set({});
            this.manualRollGroupCount.set(1);
            return;
        }

        this.abilityBaseScores.set({
            Strength: 10,
            Dexterity: 10,
            Constitution: 10,
            Intelligence: 10,
            Wisdom: 10,
            Charisma: 10
        });
    }

    onAbilityScoreInput(ability: string, value: string): void {
        const parsed = Number.parseInt(value, 10);
        if (Number.isNaN(parsed)) {
            return;
        }

        const method = this.selectedAbilityMethod();
        const min = method === 'point-buy' ? 8 : 3;
        const max = method === 'point-buy' ? 15 : 20;
        const clamped = Math.max(min, Math.min(max, parsed));

        this.abilityBaseScores.update((current) => ({
            ...current,
            [ability]: clamped
        }));
    }

    onStandardArraySelected(ability: string, value: string): void {
        const parsed = Number.parseInt(value, 10);
        const nextValue = Number.isNaN(parsed) ? null : parsed;

        this.standardArraySelections.update((current) => ({
            ...current,
            [ability]: nextValue
        }));

        this.abilityBaseScores.update((current) => ({
            ...current,
            [ability]: nextValue ?? 0
        }));
    }

    getStandardArraySelection(ability: string): string {
        const value = this.standardArraySelections()[ability];
        return value == null ? '' : String(value);
    }

    getStandardArrayOptions(ability: string): ReadonlyArray<number> {
        const selections = this.standardArraySelections();
        const ownValue = selections[ability];
        const takenValues = new Set(
            Object.entries(selections)
                .filter(([key, val]) => key !== ability && val != null)
                .map(([, val]) => val as number)
        );
        return this.standardArrayValues.filter((v) => !takenValues.has(v) || v === ownValue);
    }

    onPointBuySelected(ability: string, value: string): void {
        const parsed = Number.parseInt(value, 10);
        if (Number.isNaN(parsed)) {
            return;
        }

        this.abilityBaseScores.update((current) => ({
            ...current,
            [ability]: parsed
        }));
    }

    getPointBuySelection(ability: string): string {
        return String(this.getAbilityBaseScore(ability));
    }

    isPointBuyOptionDisabled(ability: string, candidate: number): boolean {
        if (this.selectedAbilityMethod() !== 'point-buy') {
            return false;
        }

        const currentScore = this.getAbilityBaseScore(ability);
        const nextSpent = this.pointBuySpent() - this.getPointBuyCost(currentScore) + this.getPointBuyCost(candidate);
        return nextSpent > this.pointBuyBudget;
    }

    addManualRollGroup(): void {
        this.manualRollGroupCount.update((count) => count + 1);
    }

    rollAbilitySlot(index: number): void {
        const rolls = [
            Math.ceil(Math.random() * 6),
            Math.ceil(Math.random() * 6),
            Math.ceil(Math.random() * 6),
            Math.ceil(Math.random() * 6)
        ];
        rolls.sort((a, b) => b - a);
        const total = rolls[0] + rolls[1] + rolls[2];

        this.rolledValues.update((current) => {
            const next = [...current];
            next[index] = total;
            return next;
        });
    }

    resetManualRollGroup(): void {
        this.rolledValues.set([null, null, null, null, null, null]);
        this.rolledAssignments.set({});
    }

    applyManualRolledScores(): void {
        const nextScores: Record<string, number> = {
            Strength: 0,
            Dexterity: 0,
            Constitution: 0,
            Intelligence: 0,
            Wisdom: 0,
            Charisma: 0
        };

        this.rolledValues().forEach((value, index) => {
            const abilityName = this.abilityTiles[index];
            if (abilityName && value != null) {
                nextScores[abilityName] = value;
            }
        });

        this.abilityBaseScores.set(nextScores);
    }

    getManualRolledDisplay(index: number): string {
        const value = this.rolledValues()[index];
        return value == null ? '--' : String(value);
    }

    getAbilityBaseScore(ability: string): number {
        return this.abilityBaseScores()[ability] ?? 10;
    }

    getTotalScore(ability: string): number {
        return this.abilityOverrideScores()[ability] ?? this.getAbilityBaseScore(ability);
    }

    getTotalModifier(ability: string): string {
        const score = this.getTotalScore(ability);
        const base = Math.floor((score - 10) / 2);
        const other = this.abilityOtherModifiers()[ability] ?? 0;
        const total = base + other;
        return total >= 0 ? `+${total}` : `${total}`;
    }

    getOtherModifierDisplay(ability: string): string {
        const val = this.abilityOtherModifiers()[ability];
        return val == null ? '' : String(val);
    }

    getOverrideScoreDisplay(ability: string): string {
        const val = this.abilityOverrideScores()[ability];
        return val == null ? '' : String(val);
    }

    onOtherModifierInput(ability: string, value: string): void {
        const parsed = Number.parseInt(value, 10);
        this.abilityOtherModifiers.update((c) => ({ ...c, [ability]: Number.isNaN(parsed) ? null : parsed }));
    }

    onOverrideScoreInput(ability: string, value: string): void {
        const parsed = Number.parseInt(value, 10);
        this.abilityOverrideScores.update((c) => ({ ...c, [ability]: Number.isNaN(parsed) ? null : parsed }));
    }

    getAbilityModifier(score: number): string {
        const modifier = Math.floor((score - 10) / 2);
        return modifier >= 0 ? `+${modifier}` : `${modifier}`;
    }

    getPointBuyCost(score: number): number {
        if (score <= 8) {
            return 0;
        }
        if (score <= 13) {
            return score - 8;
        }
        if (score === 14) {
            return 7;
        }
        return 9;
    }

    getPointBuyOptionLabel(value: number): string {
        const cost = this.getPointBuyCost(value);
        if (cost === 0) {
            return String(value);
        }
        const unit = cost === 1 ? 'Point' : 'Points';
        return `${value} (-${cost} ${unit})`;
    }
}
