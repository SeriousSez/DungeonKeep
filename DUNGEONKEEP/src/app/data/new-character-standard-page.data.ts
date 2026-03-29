import type { BuilderInfo, BackgroundDetail, EquipmentItem, EquipmentSource } from './new-character-standard-page.types';

export const equipmentSourceLinks: ReadonlyArray<EquipmentSource> = [
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

export const equipmentCatalog: ReadonlyArray<EquipmentItem> = [
    // Simple Melee Weapons
    { name: 'Club', category: 'Weapon', sourceUrl: 'https://dnd5e.wikidot.com/weapons', weight: 2, costGp: 0.01, notes: 'Simple, Light' },
    { name: 'Dagger', category: 'Weapon', sourceUrl: 'https://dnd5e.wikidot.com/weapons', weight: 1, costGp: 2, notes: 'Simple, Finesse, Light, Thrown, Nick, Range (20/60)' },
    { name: 'Greatclub', category: 'Weapon', sourceUrl: 'https://dnd5e.wikidot.com/weapons', weight: 10, costGp: 0.02, notes: 'Simple, Two-Handed' },
    { name: 'Handaxe', category: 'Weapon', sourceUrl: 'https://dnd5e.wikidot.com/weapons', weight: 2, costGp: 5, notes: 'Simple, Light, Thrown, Range (20/60)' },
    { name: 'Javelin', category: 'Weapon', sourceUrl: 'https://dnd5e.wikidot.com/weapons', weight: 2, costGp: 0.05, notes: 'Simple, Thrown, Range (30/120)' },
    { name: 'Light Hammer', category: 'Weapon', sourceUrl: 'https://dnd5e.wikidot.com/weapons', weight: 2, costGp: 2, notes: 'Simple, Light, Thrown, Range (20/60)' },
    { name: 'Mace', category: 'Weapon', sourceUrl: 'https://dnd5e.wikidot.com/weapons', weight: 4, costGp: 5, notes: 'Simple' },
    { name: 'Quarterstaff', category: 'Weapon', sourceUrl: 'https://dnd5e.wikidot.com/weapons', weight: 4, costGp: 0.02, notes: 'Simple, Versatile (1d8)' },
    { name: 'Sickle', category: 'Weapon', sourceUrl: 'https://dnd5e.wikidot.com/weapons', weight: 2, costGp: 1, notes: 'Simple, Light, Nick' },
    { name: 'Spear', category: 'Weapon', sourceUrl: 'https://dnd5e.wikidot.com/weapons', weight: 3, costGp: 1, notes: 'Simple, Thrown, Versatile (1d8), Range (20/60)' },
    // Simple Ranged Weapons
    { name: 'Crossbow, Light', category: 'Weapon', sourceUrl: 'https://dnd5e.wikidot.com/weapons', weight: 5, costGp: 25, notes: 'Simple, Ammunition, Loading, Two-Handed, Slow, Range (80/320)' },
    { name: 'Shortbow', category: 'Weapon', sourceUrl: 'https://dnd5e.wikidot.com/weapons', weight: 2, costGp: 25, notes: 'Simple, Ammunition, Two-Handed, Range (80/320)' },
    // Martial Ranged Weapons
    { name: 'Longbow', category: 'Weapon', sourceUrl: 'https://dnd5e.wikidot.com/weapons', weight: 2, costGp: 50, notes: 'Martial, Ammunition, Heavy, Two-Handed, Range (150/600)' },
    // Martial Melee Weapons
    { name: 'Longsword', category: 'Weapon', sourceUrl: 'https://dnd5e.wikidot.com/weapons', weight: 3, costGp: 15, notes: 'Martial, Versatile (1d10)' },
    { name: 'Greatsword', category: 'Weapon', sourceUrl: 'https://dnd5e.wikidot.com/weapons', weight: 6, costGp: 50, notes: 'Martial, Heavy, Two-Handed, Graze' },
    { name: 'Warhammer', category: 'Weapon', sourceUrl: 'https://dnd5e.wikidot.com/weapons', weight: 2, costGp: 15, notes: 'Martial, Versatile (1d10)' },
    { name: 'Rapier', category: 'Weapon', sourceUrl: 'https://dnd5e.wikidot.com/weapons', weight: 2, costGp: 25, notes: 'Martial, Finesse, Vex' },
    { name: 'Scimitar', category: 'Weapon', sourceUrl: 'https://dnd5e.wikidot.com/weapons', weight: 3, costGp: 25, notes: 'Martial, Finesse, Light, Nick' },
    // Armor
    { name: 'Padded Armor', category: 'Armor', sourceUrl: 'https://dnd5e.wikidot.com/armor', weight: 8, costGp: 5, notes: 'Light Armor, AC 11+Dex, Stealth Disadvantage' },
    { name: 'Leather Armor', category: 'Armor', sourceUrl: 'https://dnd5e.wikidot.com/armor', weight: 10, costGp: 10, notes: 'Light Armor, AC 11+Dex' },
    { name: 'Studded Leather Armor', category: 'Armor', sourceUrl: 'https://dnd5e.wikidot.com/armor', weight: 13, costGp: 45, notes: 'Light Armor, AC 12+Dex' },
    { name: 'Chain Shirt', category: 'Armor', sourceUrl: 'https://dnd5e.wikidot.com/armor', weight: 20, costGp: 50, notes: 'Medium Armor, AC 13+Dex (max 2)' },
    { name: 'Scale Mail', category: 'Armor', sourceUrl: 'https://dnd5e.wikidot.com/armor', weight: 45, costGp: 50, notes: 'Medium Armor, AC 14+Dex (max 2), Stealth Disadvantage' },
    { name: 'Breastplate', category: 'Armor', sourceUrl: 'https://dnd5e.wikidot.com/armor', weight: 20, costGp: 400, notes: 'Medium Armor, AC 14+Dex (max 2)' },
    { name: 'Half Plate', category: 'Armor', sourceUrl: 'https://dnd5e.wikidot.com/armor', weight: 40, costGp: 750, notes: 'Medium Armor, AC 15+Dex (max 2), Stealth Disadvantage' },
    { name: 'Chain Mail', category: 'Armor', sourceUrl: 'https://dnd5e.wikidot.com/armor', weight: 55, costGp: 75, notes: 'Heavy Armor, AC 16, Str 13 required, Stealth Disadvantage' },
    { name: 'Splint Armor', category: 'Armor', sourceUrl: 'https://dnd5e.wikidot.com/armor', weight: 60, costGp: 200, notes: 'Heavy Armor, AC 17, Str 15 required, Stealth Disadvantage' },
    { name: 'Plate Armor', category: 'Armor', sourceUrl: 'https://dnd5e.wikidot.com/armor', weight: 65, costGp: 1500, notes: 'Heavy Armor, AC 18, Str 15 required, Stealth Disadvantage' },
    { name: 'Shield', category: 'Armor', sourceUrl: 'https://dnd5e.wikidot.com/armor', weight: 6, costGp: 10, notes: '+2 AC' },
    // Adventuring Gear
    { name: 'Abacus', category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 2, costGp: 2, notes: 'Utility' },
    { name: 'Acid (Vial)', category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 1, costGp: 25, notes: 'Throwable, 2d6 acid damage in 5-ft square' },
    { name: "Alchemist's Fire (Flask)", category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 1, costGp: 50, notes: 'Throwable, 1d4 fire damage/round until extinguished' },
    { name: 'Backpack', category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 5, costGp: 2, notes: 'Container, 30 lb / 1 cu. ft. capacity' },
    { name: 'Bedroll', category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 7, costGp: 1, notes: 'Sleep comfort, outdoors rest' },
    { name: 'Caltrops (Bag of 20)', category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 2, costGp: 1, notes: 'Spread in 5-ft square, 1 CP damage, speed halved' },
    { name: 'Crowbar', category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 5, costGp: 2, notes: 'Advantage on Strength checks requiring leverage' },
    { name: "Explorer's Pack", category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 59, costGp: 10, notes: 'Backpack, bedroll, mess kit, tinderbox, 10 torches, 10 rations, waterskin, 50-ft rope' },
    { name: 'Grappling Hook', category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 4, costGp: 2, notes: 'Utility, Exploration, Climbing' },
    { name: "Healer's Kit", category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 3, costGp: 5, notes: '10 uses, stabilize dying without ability check' },
    { name: 'Lantern, Hooded', category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 2, costGp: 5, notes: '30-ft bright / 60-ft dim light, 6 hrs per pint of oil' },
    { name: 'Lamp', category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 1, costGp: 0.5, notes: '20-ft bright / 20-ft dim light, burns 1 pint of oil for 6 hours' },
    { name: 'Oil (flask)', category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 1, costGp: 0.1, notes: 'Fuel for lamps/lanterns; can be thrown and ignited' },
    { name: 'Ink (1-ounce bottle)', category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 0, costGp: 10, notes: 'Writing supply' },
    { name: 'Ink Pen', category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 0, costGp: 0.02, notes: 'Writing implement' },
    { name: 'Paper (sheet)', category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 0, costGp: 0.2, notes: 'Writing surface' },
    { name: 'Parchment (sheet)', category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 0, costGp: 0.1, notes: 'Writing surface' },
    { name: 'Book of Lore', category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 5, costGp: 25, notes: 'Reference text for academic research and lore checks' },
    { name: 'Little Bag of Sand', category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 0.5, costGp: 0, notes: 'Used to dry fresh ink' },
    { name: 'Small Knife', category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 0.5, costGp: 0, notes: 'Utility cutting tool' },
    { name: 'Rations (1 day)', category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 2, costGp: 0.5, notes: 'Consumable, dried food for one day' },
    { name: 'Rope, Hempen (50 feet)', category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 10, costGp: 1, notes: 'AC 11, 2 HP, supports up to 500 lb, Utility, Exploration' },
    { name: 'Torch', category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 1, costGp: 0.01, notes: '1 hour, 20-ft bright / 20-ft dim light, 1 fire damage' },
    { name: 'Waterskin', category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 5, costGp: 0.02, notes: 'Holds 4 pints of liquid' },
    { name: 'Trinket (Random)', category: 'Trinket', sourceUrl: 'https://dnd5e.wikidot.com/trinkets' },
    { name: 'Rabbit Foot Charm', category: 'Trinket', sourceUrl: 'https://dnd5e.wikidot.com/trinkets' },
    { name: 'Old Rusty Key', category: 'Trinket', sourceUrl: 'https://dnd5e.wikidot.com/trinkets' },
    { name: 'Tiny Box with a Button', category: 'Trinket', sourceUrl: 'https://dnd5e.wikidot.com/trinkets' },
    { name: 'Azurite (10 gp)', category: 'Gemstone', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', costGp: 10, notes: 'Opaque mottled deep blue gemstone' },
    { name: 'Obsidian (10 gp)', category: 'Gemstone', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', costGp: 10, notes: 'Opaque black volcanic glass' },
    { name: 'Bloodstone (50 gp)', category: 'Gemstone', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', costGp: 50, notes: 'Opaque dark gray with red flecks' },
    { name: 'Jasper (50 gp)', category: 'Gemstone', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', costGp: 50, notes: 'Opaque blue, black, or brown stone' },
    { name: 'Amber (100 gp)', category: 'Gemstone', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', costGp: 100, notes: 'Transparent watery gold to rich gold' },
    { name: 'Pearl (100 gp)', category: 'Gemstone', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', costGp: 100, notes: 'Lustrous white, yellow, or pink' },
    { name: 'Black Opal (1000 gp)', category: 'Gemstone', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', costGp: 1000, notes: 'Translucent dark green with black mottling and golden flecks' },
    { name: 'Blue Sapphire (1000 gp)', category: 'Gemstone', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', costGp: 1000, notes: 'Transparent blue-white to medium blue' },
    { name: 'Diamond (5000 gp)', category: 'Gemstone', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', costGp: 5000, notes: 'Transparent blue-white, canary, pink, brown, or blue' },
    { name: 'Ruby (5000 gp)', category: 'Gemstone', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', costGp: 5000, notes: 'Transparent clear red to deep crimson' },
    { name: 'Amulet', category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 1, costGp: 5, notes: 'Holy symbol focus' },
    { name: 'Spellbook', category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 3, costGp: 50, notes: '100 pages, records wizard spells' },
    { name: 'Holy Water (Flask)', category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 1, costGp: 25, notes: 'Throwable, 2d6 radiant vs undead/fiends in 5-ft square' },
    { name: 'Fishing Tackle', category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 4, costGp: 1, notes: 'Utility, Exploration' },
    { name: 'Hunting Trap', category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 25, costGp: 5, notes: 'DC 13 Dex or 1d4 pierce + restrained until escaped' },
    { name: 'Portable Ram', category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 35, costGp: 4, notes: '+4 Str to break doors; advantage with helper' },
    { name: 'Mess Kit', category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 1, costGp: 0.02, notes: 'Tin cup, fork, knife, and plate' },
    { name: "Miner's Pick", category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 10, costGp: 2, notes: 'Mining, Excavation tool' },
    { name: 'Pitons (10)', category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 2.5, costGp: 0.05, notes: 'Iron spikes for climbing, Utility' },
    { name: 'Whetstone', category: 'Adventuring Gear', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 1, costGp: 0.01, notes: 'Sharpen bladed weapons' },
    { name: 'Iron, 1 lb', category: 'Trade Good', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 1, costGp: 0.01, notes: 'Trade commodity' },
    { name: 'Salt, 1 lb', category: 'Trade Good', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 1, costGp: 0.05, notes: 'Trade commodity, preservation' },
    { name: 'Wheat, 1 lb', category: 'Trade Good', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 1, costGp: 0.01, notes: 'Trade commodity, food' },
    { name: 'Flour, 1 lb', category: 'Trade Good', sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 1, costGp: 0.02, notes: 'Trade commodity, baking' },
    // Firearms (Renaissance/Gunpowder from DMG)
    { name: 'Pistol', category: 'Firearm', sourceUrl: 'https://dnd5e.wikidot.com/firearms', weight: 3, costGp: 250, notes: 'Martial, Ammunition, Loading, Range (30/90)' },
    { name: 'Musket', category: 'Firearm', sourceUrl: 'https://dnd5e.wikidot.com/firearms', weight: 10, costGp: 500, notes: 'Martial, Ammunition, Loading, Two-Handed, Range (40/120)' },
    { name: 'Pepperbox', category: 'Firearm', sourceUrl: 'https://dnd5e.wikidot.com/firearms', weight: 5, costGp: 250, notes: 'Martial, Ammunition, Reload (6 shots), Range (30/90)' },
    { name: 'Blunderbuss', category: 'Firearm', sourceUrl: 'https://dnd5e.wikidot.com/firearms', weight: 10, costGp: 300, notes: 'Martial, Ammunition, Loading, Two-Handed, Range (15/30)' },
    // Explosives (DMG optional)
    { name: 'Bomb', category: 'Explosive', sourceUrl: 'https://dnd5e.wikidot.com/explosives', weight: 1, costGp: 150, notes: 'Throwable, 3d6 fire in 5-ft sphere, DC 12 Dex half' },
    { name: 'Dynamite (Stick)', category: 'Explosive', sourceUrl: 'https://dnd5e.wikidot.com/explosives', weight: 1, costGp: 50, notes: 'Fused, 3d6 bludgeoning in 10-ft sphere, DC 12 Dex half' },
    { name: 'Fragmentation Grenade', category: 'Explosive', sourceUrl: 'https://dnd5e.wikidot.com/explosives', weight: 1, costGp: 50, notes: 'Throwable, 5d6 piercing in 20-ft sphere, DC 15 Dex half' },
    { name: 'Smoke Grenade', category: 'Explosive', sourceUrl: 'https://dnd5e.wikidot.com/explosives', weight: 1, costGp: 40, notes: 'Throwable, heavily obscured 20-ft sphere for 1 minute' },
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
    // Poisons
    { name: 'Basic Poison (Vial)', category: 'Poison', sourceUrl: 'https://dnd5e.wikidot.com/poisons', costGp: 100, notes: 'Contact, DC 13 Con or poisoned for 1 hour' },
    { name: "Assassin's Blood", category: 'Poison', sourceUrl: 'https://dnd5e.wikidot.com/poisons', costGp: 150, notes: 'Ingested, DC 10 Con or 1d12 poison + poisoned 24 hours' },
    { name: 'Burnt Othur Fumes', category: 'Poison', sourceUrl: 'https://dnd5e.wikidot.com/poisons', costGp: 500, notes: 'Inhaled, DC 13 Con or 3d6 poison damage + 1d6/round until save' },
    { name: 'Crawler Mucus', category: 'Poison', sourceUrl: 'https://dnd5e.wikidot.com/poisons', costGp: 200, notes: 'Contact, DC 13 Con or paralyzed up to 1 minute' },
    { name: 'Drow Poison', category: 'Poison', sourceUrl: 'https://dnd5e.wikidot.com/poisons', costGp: 200, notes: 'Injury, DC 13 Con or unconscious up to 1 hour' },
    { name: 'Purple Worm Poison', category: 'Poison', sourceUrl: 'https://dnd5e.wikidot.com/poisons', costGp: 2000, notes: 'Injury, DC 19 Con or 12d6 poison + 1d4 Str (death at 0)' },
    // Tools
    { name: "Alchemist's Supplies", category: 'Tools', sourceUrl: 'https://dnd5e.wikidot.com/tools', weight: 8, costGp: 50, notes: 'Craft alchemical items, identify substances' },
    { name: "Brewer's Supplies", category: 'Tools', sourceUrl: 'https://dnd5e.wikidot.com/tools', weight: 9, costGp: 20, notes: 'Brew ales, meads, and other fermented beverages' },
    { name: "Calligrapher's Supplies", category: 'Tools', sourceUrl: 'https://dnd5e.wikidot.com/tools', weight: 5, costGp: 10, notes: 'Produce legible writing, create maps and forgeries' },
    { name: "Carpenter's Tools", category: 'Tools', sourceUrl: 'https://dnd5e.wikidot.com/tools', weight: 6, costGp: 8, notes: 'Build structures, craft wooden objects' },
    { name: "Cook's Utensils", category: 'Tools', sourceUrl: 'https://dnd5e.wikidot.com/tools', weight: 8, costGp: 1, notes: 'Prepare food and identify ingredients' },
    { name: 'Disguise Kit', category: 'Tools', sourceUrl: 'https://dnd5e.wikidot.com/tools', weight: 3, costGp: 25, notes: 'Alter appearance, create costumes' },
    { name: 'Forgery Kit', category: 'Tools', sourceUrl: 'https://dnd5e.wikidot.com/tools', weight: 5, costGp: 15, notes: 'Duplicate documents, create false credentials' },
    { name: 'Herbalism Kit', category: 'Tools', sourceUrl: 'https://dnd5e.wikidot.com/tools', weight: 3, costGp: 5, notes: 'Identify plants, craft antitoxin and healing potions' },
    { name: "Navigator's Tools", category: 'Tools', sourceUrl: 'https://dnd5e.wikidot.com/tools', weight: 2, costGp: 25, notes: 'Chart a course, determine position at sea' },
    { name: "Poisoner's Kit", category: 'Tools', sourceUrl: 'https://dnd5e.wikidot.com/tools', weight: 2, costGp: 50, notes: 'Craft poisons and identify them' },
    { name: "Thieves' Tools", category: 'Tools', sourceUrl: 'https://dnd5e.wikidot.com/tools', weight: 1, costGp: 25, notes: 'Pick locks and disarm traps' },
    // Siege Equipment
    { name: 'Ballista', category: 'Siege Equipment', sourceUrl: 'https://dnd5e.wikidot.com/siege-equipment', weight: 0, costGp: 0, notes: 'Siege weapon, 3d10 piercing, range 120/480' },
    { name: 'Mangonel', category: 'Siege Equipment', sourceUrl: 'https://dnd5e.wikidot.com/siege-equipment', weight: 0, costGp: 0, notes: 'Siege weapon, 5d10 bludgeoning, range 200/800' },
    { name: 'Trebuchet', category: 'Siege Equipment', sourceUrl: 'https://dnd5e.wikidot.com/siege-equipment', weight: 0, costGp: 0, notes: 'Siege weapon, 8d10 bludgeoning, range 300/1200' },
    { name: 'Battering Ram', category: 'Siege Equipment', sourceUrl: 'https://dnd5e.wikidot.com/siege-equipment', weight: 0, costGp: 0, notes: 'Breaks structures, 3d4+10 bludgeoning vs objects' },
    { name: 'Siege Tower', category: 'Siege Equipment', sourceUrl: 'https://dnd5e.wikidot.com/siege-equipment', weight: 0, costGp: 0, notes: 'Mobile cover, allows troops to scale walls' }
];

export const classStartingPackages = {
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

export const backgroundStartingPackages = {
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

export const validSteps = new Set(['home', 'class', 'background', 'species', 'abilities', 'equipment', 'whats-next']);

export const classInfoMap: Record<string, BuilderInfo> = {
    Artificer: {
        name: 'Artificer',
        source: "Eberron / Tasha's",
        summary: 'Inventive half-caster using infusions, tools, and magical engineering to empower a party through preparation and magical gear.',
        highlights: ['Primary focus: Intelligence', 'Core feature: Infuse Item', 'Flexible support, utility, and magical item synergy'],
        details: {
            tagline: 'A Magical Inventor Who Builds Power Through Tools and Infusions',
            primaryAbility: 'Intelligence',
            hitPointDie: 'd8 per Artificer level',
            saves: 'Constitution and Intelligence',
            levelOneGains: [
                'Gain Magical Tinkering plus Spellcasting support tools, with utility effects that reward creative problem-solving.',
                'Start with light armor, medium armor, shields, simple weapons, and thieves\' tools and artisan tool proficiency.',
                'Choose your equipment package and establish your role as a flexible support, utility, or control specialist.'
            ],
            coreTraits: [
                { label: 'Primary Ability', value: 'Intelligence' },
                { label: 'Hit Point Die', value: 'd8 per Artificer level' },
                { label: 'Saving Throw Proficiencies', value: 'Constitution and Intelligence' },
                { label: 'Skill Proficiencies', value: 'Choose 2: Arcana, History, Investigation, Medicine, Nature, Perception, Sleight of Hand' },
                { label: 'Armor Training', value: 'Light armor, medium armor, shields' },
                { label: 'Weapon Proficiencies', value: 'Simple weapons' },
                { label: 'Tool Proficiencies', value: 'Thieves\' tools, tinkers\' tools, and one type of artisan\'s tools' },
                { label: 'Spellcasting Profile', value: 'Half-caster using Intelligence; prepared spells from the Artificer list' }
            ],
            levelMilestones: [
                { title: 'Level 1', summary: 'Magical Tinkering, Spellcasting foundation', details: 'You begin as a utility-focused caster with practical magical effects and a strong baseline for problem-solving through tools.' },
                { title: 'Level 2', summary: 'Infuse Item, replicated item access', details: 'Infusions become your signature system, letting you turn ordinary gear into reliable magic-enhanced equipment for yourself or allies.' },
                { title: 'Level 3', summary: 'Artificer Specialist, The Right Tool for the Job', details: 'Subclass identity starts here (Alchemist, Armorer, Artillerist, or Battle Smith), shaping whether you lean support, durability, or offense.' },
                { title: 'Level 4', summary: 'Ability Score Improvement', details: 'First major optimization point: usually Intelligence scaling, concentration resilience, or feat-based utility.' },
                { title: 'Level 5', summary: '2nd-level spells, specialist feature', details: 'Core power jump with stronger spell options and subclass scaling that defines your round-to-round impact.' },
                { title: 'Level 6', summary: 'Tool Expertise', details: 'Double proficiency on chosen tool checks significantly improves downtime, crafting, and technical problem-solving.' },
                { title: 'Level 7', summary: 'Flash of Genius', details: 'You can add Intelligence modifier to key ability checks or saving throws, creating high-impact clutch support moments.' },
                { title: 'Level 9', summary: '3rd-level spells, specialist feature', details: 'Mid-tier spell access and subclass advancement increase tactical options, especially in control and sustained utility play.' },
                { title: 'Level 10', summary: 'Magic Item Adept', details: 'Attunement capacity and crafting speed improve, reinforcing your role as the party\'s magical equipment architect.' },
                { title: 'Level 11', summary: 'Spell-Storing Item', details: 'You can store a lower-level spell for repeated group use, dramatically improving action economy and team flexibility.' },
                { title: 'Level 14', summary: 'Magic Item Savant', details: 'Attunement and item-use restrictions loosen further, letting you leverage a wider range of magical tools than most classes.' },
                { title: 'Level 15', summary: 'Specialist feature', details: 'Subclass capstone tier arrives, often defining your late-game identity around defense, damage support, or battlefield control.' },
                { title: 'Level 18', summary: 'Magic Item Master', details: 'High attunement capacity turns your equipment loadout into a major source of durability, utility, and encounter shaping.' },
                { title: 'Level 20', summary: 'Soul of Artifice', details: 'Your capstone ties survivability and saves to attunement, making magical item planning central to endgame resilience.' }
            ],
            featureNotes: [
                { title: 'Infusion Economy', summary: 'Known infusions and active infusions are separate limits.', details: 'Prepare infusions that match your party plan each day; choose active infusions carefully because only some can remain active at once.' },
                { title: 'Prepared Casting Rhythm', summary: 'Prepared spell list scales with level and Intelligence.', details: 'Artificer rewards daily planning: swap utility and encounter tools between rests instead of locking into a fixed known-spell profile.' },
                { title: 'Concentration and Positioning', summary: 'Many top artificer spells rely on sustained concentration.', details: 'Build and play around concentration protection through Constitution saves, safe positioning, and action economy discipline.' },
                { title: 'Tool Identity in Play', summary: 'Tool proficiencies are a mechanical pillar, not just flavor.', details: 'Skill challenges, crafting, trap solutions, and technical checks all improve when you actively leverage your tool package.' },
                { title: 'Subclass Role Signals', summary: 'Alchemist, Armorer, Artillerist, and Battle Smith each change your combat loop.', details: 'Choose subclass based on table needs: healing/utility support, defensive frontline, ranged pressure, or weapon-centric companion play.' },
                { title: 'Magic Item Synergy', summary: 'Later levels convert attunement into direct class strength.', details: 'Your power curve scales with good item planning; attunement slots become strategic resources tied to defense and reliability.' },
                { title: 'Flash of Genius Timing', summary: 'Best used on high-stakes saves and pivotal checks.', details: 'Use it reactively to prevent failed concentration saves, lock in mission-critical skill checks, or protect allies from encounter-defining effects.' },
                { title: 'Spell-Storing Item Value', summary: 'Extends core utility across the party.', details: 'Pick spells with repeat impact so allies can trigger value without consuming your main action each turn.' }
            ]
        }
    },
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

export const classDetailFallbacks: Record<string, NonNullable<BuilderInfo['details']>> = {
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

export const classSubclassSnapshots: Record<string, { summary: string; details: string }> = {
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

const langTrait = (knownLangs: string, choices = 2, choiceLabel = 'Origin') => ({
    title: 'Languages',
    summary: choices === 0
        ? knownLangs
        : `${knownLangs} plus ${choices} ${choices === 1 ? 'of your choice' : 'of your choice'}.`,
    details: choices === 0
        ? `Your character knows ${knownLangs}.`
        : `Your character knows ${knownLangs}. You also know ${choices === 1 ? 'one additional language' : `${choices} additional languages`} of your choice${choiceLabel ? `, determined by your ${choiceLabel}` : ''}.`,
    choices: choices || undefined,
    choiceLabel: choices ? choiceLabel : undefined
});

const phbSpeciesDetails: Record<string, BuilderInfo> = {
    'Dragonborn': {
        name: 'Dragonborn',
        source: "Player's Handbook 2024",
        summary: 'The ancestors of dragonborn hatched from the eggs of chromatic and metallic dragons.',
        highlights: ['Breath Weapon', 'Draconic Ancestry', 'Draconic Flight'],
        speciesDetails: {
            tagline: 'Dragonborn Lineage Overview',
            creatureType: 'Humanoid',
            size: 'Medium',
            speed: '30 ft.',
            sourceUrl: 'https://dnd5e.wikidot.com/lineage:dragonborn',
            traits: ['Draconic Ancestry', 'Breath Weapon', 'Damage Resistance', 'Darkvision', 'Draconic Flight', 'Languages'],
            coreTraits: [
                { label: 'Creature Type', value: 'Humanoid' },
                { label: 'Size', value: 'Medium' },
                { label: 'Speed', value: '30 ft.' }
            ],
            traitNotes: [
                {
                    title: 'Draconic Ancestry',
                    summary: 'Choose your dragon type and damage element.',
                    details: 'You have draconic ancestry of a particular type of dragon. Choose one: Black (Acid), Blue (Lightning), Brass (Fire), Bronze (Lightning), Copper (Acid), Gold (Fire), Green (Poison), Red (Fire), Silver (Cold), White (Cold). This determines the damage type of your Breath Weapon and your Damage Resistance.',
                    choices: 1
                },
                {
                    title: 'Breath Weapon',
                    summary: 'Exhale destructive elemental energy during an attack.',
                    details: 'When you take the Attack action on your turn, you can replace one of your attacks with an exhalation of magical energy in a 30-foot line (5 ft. wide) or a 15-foot cone. Each creature in that area makes a Dexterity saving throw (DC = 8 + CON modifier + proficiency bonus). On a failure, each target takes 1d10 damage of your ancestry type; half on a success. Scales: 2d10 at 5th, 3d10 at 11th, 4d10 at 17th. Uses equal to your proficiency bonus per long rest.'
                },
                {
                    title: 'Damage Resistance',
                    summary: 'Resist your ancestry\'s damage type.',
                    details: 'You have Resistance to the damage type determined by your Draconic Ancestry.'
                },
                {
                    title: 'Darkvision',
                    summary: 'See in dim light and darkness within 60 ft.',
                    details: 'You have Darkvision with a range of 60 feet. Within that range, you can see in dim light as if it were bright light, and in darkness as if it were dim light. You discern colors in darkness only as shades of gray.'
                },
                {
                    title: 'Draconic Flight',
                    summary: 'Sprout spectral wings and fly (5th level).',
                    details: 'When you reach 5th level, you can channel your draconic magic to give yourself temporary wings. As a Bonus Action, you sprout spectral wings on your back that last for 10 minutes or until you retract them as a Bonus Action. While the wings are present, you have a Fly Speed equal to your Speed.'
                },
                langTrait('Common and Draconic')
            ]
        }
    },
    'Dwarf': {
        name: 'Dwarf',
        source: "Player's Handbook",
        summary: 'Dwarves are known for their skill in warfare, mining, and stonework, with unmatched endurance and loyalty to clan.',
        highlights: ['Dwarven Resilience', 'Darkvision', 'Stonecunning'],
        speciesDetails: {
            tagline: 'Dwarf Lineage Overview',
            creatureType: 'Humanoid',
            size: 'Medium',
            speed: '30 ft.',
            sourceUrl: 'https://dnd5e.wikidot.com/lineage:dwarf',
            traits: ['Darkvision', 'Dwarven Resilience', 'Dwarven Toughness', 'Stonecunning', 'Languages'],
            coreTraits: [
                { label: 'Creature Type', value: 'Humanoid' },
                { label: 'Size', value: 'Medium' },
                { label: 'Speed', value: '30 ft.' }
            ],
            traitNotes: [
                {
                    title: 'Darkvision',
                    summary: 'See in dim light and darkness within 120 ft.',
                    details: 'Accustomed to life underground, you have Darkvision with a range of 120 feet. You can see in dim light as if it were bright light, and in darkness as if it were dim light. You discern colors in darkness only as shades of gray.'
                },
                {
                    title: 'Dwarven Resilience',
                    summary: 'Advantage against poison; resistance to poison damage.',
                    details: 'You have Advantage on saving throws you make to avoid or end the Poisoned condition on yourself. You also have Resistance to Poison damage.'
                },
                {
                    title: 'Dwarven Toughness',
                    summary: '+1 hit point maximum per level.',
                    details: 'Your hit point maximum increases by 1, and it increases by 1 again whenever you gain a level.'
                },
                {
                    title: 'Stonecunning',
                    summary: 'Tremorsense and stonework expertise.',
                    details: 'As a Bonus Action, you can gain Tremorsense with a range of 60 feet for 10 minutes. You must be on a surface or in a liquid that is connected to the ground for this Tremorsense to work. You can use this Bonus Action a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Long Rest.'
                },
                langTrait('Common and Dwarvish')
            ]
        }
    },
    'Elf': {
        name: 'Elf',
        source: "Player's Handbook",
        summary: 'Elves are a magical people of otherworldly grace, living in places of ethereal beauty amid ancient forests and faerie light.',
        highlights: ['Elven Lineage', 'Fey Ancestry', 'Trance'],
        speciesDetails: {
            tagline: 'Elf Lineage Overview',
            creatureType: 'Humanoid',
            size: 'Medium',
            speed: '30 ft.',
            sourceUrl: 'https://dnd5e.wikidot.com/lineage:elf',
            traits: ['Darkvision', 'Elven Lineage', 'Fey Ancestry', 'Keen Senses', 'Trance', 'Languages'],
            coreTraits: [
                { label: 'Creature Type', value: 'Humanoid' },
                { label: 'Size', value: 'Medium' },
                { label: 'Speed', value: '30 ft.' }
            ],
            traitNotes: [
                {
                    title: 'Darkvision',
                    summary: 'See in dim light and darkness within 60 ft.',
                    details: 'You have Darkvision with a range of 60 feet. You can see in dim light as if it were bright light, and in darkness as if it were dim light. You discern colors in darkness only as shades of gray.'
                },
                {
                    title: 'Elven Lineage',
                    summary: 'Choose your elven subrace and innate spells.',
                    details: 'You are part of an elven lineage that grants you additional traits. Choose one of the following: Drow (Darkvision 120 ft., Drow Magic spells), High Elf (Cantrip from Wizard spell list, +1 language), Wood Elf (Speed 35 ft., Mask of the Wild). Each lineage also grants additional spells as you level up.',
                    choices: 1
                },
                {
                    title: 'Fey Ancestry',
                    summary: 'Advantage against being charmed; immune to magical sleep.',
                    details: 'You have Advantage on saving throws you make to avoid or end the Charmed condition on yourself. Magic can\'t put you to sleep.'
                },
                {
                    title: 'Keen Senses',
                    summary: 'Proficiency in the Perception skill.',
                    details: 'You have proficiency in the Perception skill.'
                },
                {
                    title: 'Trance',
                    summary: 'Meditate 4 hours instead of sleeping 8.',
                    details: 'Elves don\'t need to sleep. Instead, they meditate deeply for 4 hours a day. After resting this way, you gain the same benefit a human does from 8 hours of sleep. While meditating, you remain semiconscious and can perceive your surroundings.'
                },
                langTrait('Common and Elvish')
            ]
        }
    },
    'Gnome': {
        name: 'Gnome',
        source: "Player's Handbook",
        summary: 'Gnomes are quick of mind and fleet of foot, with an inventive spirit and a natural affinity for the arcane.',
        highlights: ['Gnomish Lineage', 'Gnomish Cunning', 'Darkvision'],
        speciesDetails: {
            tagline: 'Gnome Lineage Overview',
            creatureType: 'Humanoid',
            size: 'Small',
            speed: '30 ft.',
            sourceUrl: 'https://dnd5e.wikidot.com/lineage:gnome',
            traits: ['Darkvision', 'Gnomish Cunning', 'Gnomish Lineage', 'Languages'],
            coreTraits: [
                { label: 'Creature Type', value: 'Humanoid' },
                { label: 'Size', value: 'Small' },
                { label: 'Speed', value: '30 ft.' }
            ],
            traitNotes: [
                {
                    title: 'Darkvision',
                    summary: 'See in dim light and darkness within 60 ft.',
                    details: 'You have Darkvision with a range of 60 feet. You can see in dim light as if it were bright light, and in darkness as if it were dim light. You discern colors in darkness only as shades of gray.'
                },
                {
                    title: 'Gnomish Cunning',
                    summary: 'Advantage on Intelligence, Wisdom, and Charisma saves vs. magic.',
                    details: 'You have Advantage on Intelligence, Wisdom, and Charisma saving throws against spells and other magical effects.'
                },
                {
                    title: 'Gnomish Lineage',
                    summary: 'Choose your gnomish subrace and specialty.',
                    details: 'You are part of a gnomish lineage that grants additional traits. Choose one: Forest Gnome (Minor Illusion cantrip, speak with small animals), Rock Gnome (Artificer\'s Lore, Tinker — create small clockwork devices), Deep Gnome (Darkvision 120 ft., Svirfneblin Magic spells, Superior Stealth).',
                    choices: 1
                },
                langTrait('Common and Gnomish')
            ]
        }
    },
    'Half-Elf': {
        name: 'Half-Elf',
        source: "Player's Handbook",
        summary: 'Half-elves combine the adaptability of humans with the grace and long sight of their elven heritage.',
        highlights: ['Fey Ancestry', 'Skill Versatility', 'Adaptability'],
        speciesDetails: {
            tagline: 'Half-Elf Lineage Overview',
            creatureType: 'Humanoid',
            size: 'Medium',
            speed: '30 ft.',
            sourceUrl: 'https://dnd5e.wikidot.com/lineage:half-elf',
            traits: ['Darkvision', 'Fey Ancestry', 'Skill Versatility', 'Languages'],
            coreTraits: [
                { label: 'Creature Type', value: 'Humanoid' },
                { label: 'Size', value: 'Medium' },
                { label: 'Speed', value: '30 ft.' }
            ],
            traitNotes: [
                {
                    title: 'Darkvision',
                    summary: 'See in dim light and darkness within 60 ft.',
                    details: 'Thanks to your elven heritage, you have Darkvision with a range of 60 feet. You can see in dim light as if it were bright light, and in darkness as if it were dim light. You discern colors in darkness only as shades of gray.'
                },
                {
                    title: 'Fey Ancestry',
                    summary: 'Advantage against being charmed; immune to magical sleep.',
                    details: 'You have Advantage on saving throws you make to avoid or end the Charmed condition on yourself. Magic can\'t put you to sleep.'
                },
                {
                    title: 'Skill Versatility',
                    summary: 'Proficiency in two skills of your choice.',
                    details: 'You gain proficiency in two skills of your choice from any list.',
                    choices: 2
                },
                langTrait('Common and Elvish')
            ]
        }
    },
    'Half-Orc': {
        name: 'Half-Orc',
        source: "Player's Handbook",
        summary: 'Half-orcs inherit physical power from their orc bloodline, making them formidable warriors and enduring survivors.',
        highlights: ['Relentless Endurance', 'Savage Attacks', 'Darkvision'],
        speciesDetails: {
            tagline: 'Half-Orc Lineage Overview',
            creatureType: 'Humanoid',
            size: 'Medium',
            speed: '30 ft.',
            sourceUrl: 'https://dnd5e.wikidot.com/lineage:half-orc',
            traits: ['Darkvision', 'Menacing', 'Relentless Endurance', 'Savage Attacks', 'Languages'],
            coreTraits: [
                { label: 'Creature Type', value: 'Humanoid' },
                { label: 'Size', value: 'Medium' },
                { label: 'Speed', value: '30 ft.' }
            ],
            traitNotes: [
                {
                    title: 'Darkvision',
                    summary: 'See in dim light and darkness within 60 ft.',
                    details: 'Thanks to your orc blood, you have Darkvision with a range of 60 feet. You can see in dim light as if it were bright light, and in darkness as if it were dim light. You discern colors in darkness only as shades of gray.'
                },
                {
                    title: 'Menacing',
                    summary: 'Proficiency in the Intimidation skill.',
                    details: 'You gain proficiency in the Intimidation skill.'
                },
                {
                    title: 'Relentless Endurance',
                    summary: 'Drop to 1 HP instead of 0 once per long rest.',
                    details: 'When you are reduced to 0 hit points but not killed outright, you can drop to 1 hit point instead. You can\'t use this feature again until you finish a Long Rest.'
                },
                {
                    title: 'Savage Attacks',
                    summary: 'Roll one extra damage die on critical hits with melee weapons.',
                    details: 'When you score a Critical Hit with a melee weapon attack, you can roll one of the weapon\'s damage dice one additional time and add it to the extra damage of the Critical Hit.'
                },
                langTrait('Common and Orc')
            ]
        }
    },
    'Halfling': {
        name: 'Halfling',
        source: "Player's Handbook",
        summary: 'Halflings are small, lucky folk who survive peril through pluck, friendship, and uncanny fortune.',
        highlights: ['Lucky', 'Brave', 'Halfling Nimbleness'],
        speciesDetails: {
            tagline: 'Halfling Lineage Overview',
            creatureType: 'Humanoid',
            size: 'Small',
            speed: '30 ft.',
            sourceUrl: 'https://dnd5e.wikidot.com/lineage:halfling',
            traits: ['Brave', 'Halfling Nimbleness', 'Lucky', 'Naturally Stealthy', 'Languages'],
            coreTraits: [
                { label: 'Creature Type', value: 'Humanoid' },
                { label: 'Size', value: 'Small' },
                { label: 'Speed', value: '30 ft.' }
            ],
            traitNotes: [
                {
                    title: 'Brave',
                    summary: 'Advantage against being frightened.',
                    details: 'You have Advantage on saving throws you make to avoid or end the Frightened condition on yourself.'
                },
                {
                    title: 'Halfling Nimbleness',
                    summary: 'Move through the space of larger creatures.',
                    details: 'You can move through the space of any creature that is of a size larger than yours.'
                },
                {
                    title: 'Lucky',
                    summary: 'Reroll ones on attack rolls, ability checks, and saving throws.',
                    details: 'When you roll a 1 on the d20 for an attack roll, ability check, or saving throw, you can reroll the die and must use the new roll.'
                },
                {
                    title: 'Naturally Stealthy',
                    summary: 'Hide even when obscured only by a larger creature.',
                    details: 'You can take the Hide action even when you are obscured only by a creature that is larger than you.'
                },
                langTrait('Common and Halfling')
            ]
        }
    },
    'Human': {
        name: 'Human',
        source: "Player's Handbook",
        summary: 'Humans are the most adaptable and ambitious people among the common races, found in every corner of the known world.',
        highlights: ['Resourceful', 'Skillful', 'Versatile'],
        speciesDetails: {
            tagline: 'Human Lineage Overview',
            creatureType: 'Humanoid',
            size: 'Medium or Small',
            speed: '30 ft.',
            sourceUrl: 'https://dnd5e.wikidot.com/lineage:human',
            traits: ['Resourceful', 'Skillful', 'Versatile', 'Languages'],
            coreTraits: [
                { label: 'Creature Type', value: 'Humanoid' },
                { label: 'Size', value: 'Medium or Small (your choice)' },
                { label: 'Speed', value: '30 ft.' }
            ],
            traitNotes: [
                {
                    title: 'Resourceful',
                    summary: 'Gain Heroic Inspiration after each Long Rest.',
                    details: 'You gain Heroic Inspiration whenever you finish a Long Rest. Heroic Inspiration lets you reroll any die immediately after a roll, before the outcome is determined.'
                },
                {
                    title: 'Skillful',
                    summary: 'Proficiency in one additional skill of your choice.',
                    details: 'You gain proficiency in one skill of your choice.',
                    choices: 1
                },
                {
                    title: 'Versatile',
                    summary: 'Gain one Origin Feat of your choice.',
                    details: 'You gain one Origin Feat of your choice. Origin Feats include Alert, Crafter, Healer, Lucky, Magic Initiate, Musician, Savage Attacker, Sentinel, Sharpshooter, Skilled, Tavern Brawler, and Tough.',
                    choices: 1
                },
                langTrait('Common', 1, 'Species')
            ]
        }
    },
    'Orc': {
        name: 'Orc',
        source: "Player's Handbook 2024",
        summary: 'Orcs are equipped with gifts to help them wander great plains, vast caverns, and churning seas.',
        highlights: ['Adrenaline Rush', 'Darkvision', 'Relentless Endurance'],
        speciesDetails: {
            tagline: 'Orc Species Overview',
            creatureType: 'Humanoid',
            size: 'Medium',
            speed: '30 ft.',
            sourceUrl: 'https://www.dndbeyond.com/species/1751442-orc',
            traits: ['Adrenaline Rush', 'Darkvision', 'Relentless Endurance', 'Languages'],
            coreTraits: [
                { label: 'Creature Type', value: 'Humanoid' },
                { label: 'Size', value: 'Medium' },
                { label: 'Speed', value: '30 ft.' }
            ],
            traitNotes: [
                {
                    title: 'Adrenaline Rush',
                    summary: 'Dash as a Bonus Action and gain temporary hit points.',
                    details: 'You can take the Dash action as a Bonus Action. When you do so, you gain temporary hit points equal to your Proficiency Bonus. You can use this trait a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Long Rest.'
                },
                {
                    title: 'Darkvision',
                    summary: 'See in dim light and darkness within 120 ft.',
                    details: 'You have Darkvision with a range of 120 feet. Within that range, you can see in dim light as if it were bright light, and in darkness as if it were dim light. You discern colors in darkness only as shades of gray.'
                },
                {
                    title: 'Relentless Endurance',
                    summary: 'Drop to 1 HP instead of 0 once per Long Rest.',
                    details: 'When you are reduced to 0 Hit Points but not killed outright, you can drop to 1 Hit Point instead. Once you use this trait, you can’t use it again until you finish a Long Rest.'
                },
                langTrait('Common and Orc')
            ]
        }
    },
    'Tiefling': {
        name: 'Tiefling',
        source: "Player's Handbook",
        summary: 'Tieflings bear in their souls the taint of a fiendish pact, giving them otherworldly power and a dark gift.',
        highlights: ['Fiendish Legacy', 'Otherworldly Presence', 'Darkvision'],
        speciesDetails: {
            tagline: 'Tiefling Lineage Overview',
            creatureType: 'Humanoid',
            size: 'Medium',
            speed: '30 ft.',
            sourceUrl: 'https://dnd5e.wikidot.com/lineage:tiefling',
            traits: ['Darkvision', 'Fiendish Legacy', 'Otherworldly Presence', 'Languages'],
            coreTraits: [
                { label: 'Creature Type', value: 'Humanoid' },
                { label: 'Size', value: 'Medium' },
                { label: 'Speed', value: '30 ft.' }
            ],
            traitNotes: [
                {
                    title: 'Darkvision',
                    summary: 'See in dim light and darkness within 60 ft.',
                    details: 'You have Darkvision with a range of 60 feet. You can see in dim light as if it were bright light, and in darkness as if it were dim light. You discern colors in darkness only as shades of gray.'
                },
                {
                    title: 'Fiendish Legacy',
                    summary: 'Choose your fiendish lineage and innate spells.',
                    details: 'You are the recipient of a fiendish legacy that grants you supernatural abilities. Choose one of the following legacies: Abyssal (demonic power — Poison Spray, Ray of Sickness, Hold Person, Darkness), Chthonic (underworld power — Chill Touch, False Life, Ray of Enfeeblement, Darkness), or Infernal (devilish power — Fire Bolt, Hellish Rebuke, Darkness). You learn spells from your legacy at 1st, 3rd, and 5th levels, using Charisma as your spellcasting ability.',
                    choices: 1
                },
                {
                    title: 'Otherworldly Presence',
                    summary: 'Know the Thaumaturgy cantrip.',
                    details: 'You know the Thaumaturgy cantrip. When you cast it, you can use Charisma as your spellcasting ability for it.'
                },
                langTrait('Common and Infernal')
            ]
        }
    }
};

const makeGenericSpeciesInfo = (
    name: string,
    summary: string,
    hallmark: string,
    slug: string,
    size: string,
    speed: string,
    knownLanguages = 'Common',
    languageChoices = 1,
    languageChoiceLabel = 'Species'
): BuilderInfo => ({
    name,
    source: "Expanded Lineages",
    summary,
    highlights: [hallmark],
    speciesDetails: {
        tagline: `${name} Lineage Overview`,
        creatureType: 'Humanoid',
        size,
        speed,
        sourceUrl: `https://dnd5e.wikidot.com/lineage:${slug}`,
        traits: ['Lineage Traits', 'Languages'],
        coreTraits: [
            { label: 'Creature Type', value: 'Humanoid' },
            { label: 'Size', value: size },
            { label: 'Speed', value: speed }
        ],
        traitNotes: [
            {
                title: 'Lineage Identity',
                summary: hallmark,
                details: `${name} provides a distinct lineage package that affects roleplay, exploration, and tactical decisions. Consult the source book for exact feature details.`
            },
            langTrait(knownLanguages, languageChoices, languageChoiceLabel)
        ]
    }
});

const speciesCatalog: Array<{ name: string; slug: string; hallmark: string; size?: string; speed?: string; knownLanguages?: string; languageChoices?: number; languageChoiceLabel?: string }> = [
    { name: 'Aarakocra', slug: 'aarakocra', hallmark: 'Aerial positioning and flight', speed: '25 ft. (fly 50 ft.)' },
    { name: 'Aasimar', slug: 'aasimar', hallmark: 'Celestial radiance and healing' },
    { name: 'Changeling', slug: 'changeling', hallmark: 'Shapeshifting social utility' },
    { name: 'Deep Gnome', slug: 'deep-gnome', hallmark: 'Subterranean stealth and resilience', size: 'Small' },
    { name: 'Duergar', slug: 'duergar', hallmark: 'Stoic underdark durability', size: 'Medium' },
    { name: 'Eladrin', slug: 'eladrin', hallmark: 'Fey teleportation by season' },
    { name: 'Fairy', slug: 'fairy', hallmark: 'Fey flight and innate magic', size: 'Small', speed: '30 ft. (fly 30 ft.)' },
    { name: 'Firbolg', slug: 'firbolg', hallmark: 'Nature-giant connection and magic' },
    { name: 'Genasi (Air)', slug: 'genasi-air', hallmark: 'Air-aspected mobility and spells' },
    { name: 'Genasi (Earth)', slug: 'genasi-earth', hallmark: 'Earth-aspected toughness and spells' },
    { name: 'Genasi (Fire)', slug: 'genasi-fire', hallmark: 'Fire-aspected damage and pressure' },
    { name: 'Genasi (Water)', slug: 'genasi-water', hallmark: 'Water-aspected adaptability and swimming' },
    { name: 'Githyanki', slug: 'githyanki', hallmark: 'Astral martial discipline and psionics' },
    { name: 'Githzerai', slug: 'githzerai', hallmark: 'Psionic defensive focus and clarity' },
    { name: 'Goliath', slug: 'goliath', hallmark: 'Athletic giant endurance' },
    { name: 'Harengon', slug: 'harengon', hallmark: 'Rabbit-folk burst mobility and initiative' },
    { name: 'Kenku', slug: 'kenku', hallmark: 'Mimicry, stealth, and trickery' },
    { name: 'Locathah', slug: 'locathah', hallmark: 'Aquatic survival and natural armor' },
    { name: 'Owlin', slug: 'owlin', hallmark: 'Silent nocturnal flight and stealth', speed: '30 ft. (fly 30 ft.)' },
    { name: 'Satyr', slug: 'satyr', hallmark: 'Fey magic resistance and social disruption' },
    { name: 'Sea Elf', slug: 'sea-elf', hallmark: 'Marine elven adaptability and swimming' },
    { name: 'Shadar-Kai', slug: 'shadar-kai', hallmark: 'Shadowfell teleportation and necrotic resistance' },
    { name: 'Tabaxi', slug: 'tabaxi', hallmark: 'Feline sprint, claws, and scouting mobility' },
    { name: 'Tortle', slug: 'tortle', hallmark: 'Natural shell defense and hold breath' },
    { name: 'Triton', slug: 'triton', hallmark: 'Sea-guardian utility and water breathing' },
    { name: 'Verdan', slug: 'verdan', hallmark: 'Adaptive growth and telepathy', size: 'Small or Medium' },
    { name: 'Bugbear', slug: 'bugbear', hallmark: 'Ambush reach and surprise pressure' },
    { name: 'Centaur', slug: 'centaur', hallmark: 'Charge-oriented movement and carry capacity', speed: '40 ft.' },
    { name: 'Goblin', slug: 'goblin', hallmark: 'Nimble skirmish utility and fury', size: 'Small' },
    { name: 'Grung', slug: 'grung', hallmark: 'Amphibious poison skin identity', size: 'Small', knownLanguages: 'Grung', languageChoices: 0, languageChoiceLabel: '' },
    { name: 'Hobgoblin', slug: 'hobgoblin', hallmark: 'Coordinated martial discipline and saving throws' },
    { name: 'Kobold', slug: 'kobold', hallmark: 'Pack-style tactics and draconic heritage', size: 'Small' },
    { name: 'Lizardfolk', slug: 'lizardfolk', hallmark: 'Primal survival, natural armor, and swimming' },
    { name: 'Minotaur', slug: 'minotaur', hallmark: 'Horns, heavy melee momentum, and navigation' },
    { name: 'Orc', slug: 'orc', hallmark: 'Aggressive frontline cadence and endurance' },
    { name: 'Shifter', slug: 'shifter', hallmark: 'Beast-touched transformation combat windows' },
    { name: 'Yuan-Ti', slug: 'yuan-ti', hallmark: 'Serpentine magic resistance and innate spells' }
];

export const speciesInfoMap: Record<string, BuilderInfo> = {
    ...Object.fromEntries(
        speciesCatalog.map((species) => [
            species.name,
            makeGenericSpeciesInfo(
                species.name,
                `${species.name} lineage with a ${species.hallmark.toLowerCase()} focus.`,
                species.hallmark,
                species.slug,
                species.size ?? 'Medium',
                species.speed ?? '30 ft.',
                species.knownLanguages ?? 'Common',
                species.languageChoices ?? 1,
                species.languageChoiceLabel ?? 'Species'
            )
        ])
    ),
    ...phbSpeciesDetails
};

export const magicInitiateSpellsByAbility: Readonly<Record<string, { cantrips: readonly string[]; level1Spells: readonly string[] }>> = {
    Wisdom: {
        cantrips: [
            'Guidance', 'Light', 'Mending', 'Resistance', 'Sacred Flame',
            'Spare the Dying', 'Thaumaturgy', 'Toll the Dead', 'Virtue'
        ],
        level1Spells: [
            'Bane', 'Bless', 'Command', 'Create or Destroy Water', 'Cure Wounds',
            'Detect Evil and Good', 'Detect Magic', 'Detect Poison and Disease',
            'Guiding Bolt', 'Healing Word', 'Inflict Wounds', 'Protection from Evil and Good',
            'Purify Food and Drink', 'Sanctuary', 'Shield of Faith'
        ]
    },
    Intelligence: {
        cantrips: [
            'Acid Splash', 'Blade Ward', 'Chill Touch', 'Dancing Lights', 'Fire Bolt',
            'Friends', 'Light', 'Mage Hand', 'Mending', 'Message',
            'Minor Illusion', 'Poison Spray', 'Prestidigitation', 'Ray of Frost',
            'Shocking Grasp', 'True Strike'
        ],
        level1Spells: [
            'Alarm', 'Burning Hands', 'Charm Person', 'Color Spray', 'Comprehend Languages',
            'Detect Magic', 'Disguise Self', 'Expeditious Retreat', 'False Life',
            'Feather Fall', 'Find Familiar', 'Fog Cloud', 'Grease', 'Identify',
            'Jump', 'Longstrider', 'Mage Armor', 'Magic Missile', 'Protection from Evil and Good',
            'Ray of Sickness', 'Shield', 'Silent Image', 'Sleep',
            "Tasha's Hideous Laughter", "Tenser's Floating Disk", 'Thunderwave',
            'Unseen Servant', 'Witch Bolt'
        ]
    },
    Charisma: {
        cantrips: [
            'Acid Splash', 'Blade Ward', 'Chill Touch', 'Dancing Lights', 'Fire Bolt',
            'Friends', 'Light', 'Mage Hand', 'Mending', 'Message', 'Mind Sliver',
            'Minor Illusion', 'Poison Spray', 'Prestidigitation', 'Ray of Frost',
            'Shocking Grasp', 'True Strike'
        ],
        level1Spells: [
            'Burning Hands', 'Charm Person', 'Color Spray', 'Comprehend Languages',
            'Detect Magic', 'Disguise Self', 'Expeditious Retreat', 'False Life',
            'Feather Fall', 'Fog Cloud', 'Grease', 'Ice Knife', 'Jump',
            'Mage Armor', 'Magic Missile', 'Ray of Sickness', 'Shield',
            'Silent Image', 'Sleep', 'Thunderwave', 'Witch Bolt'
        ]
    }
};

export const backgroundDescriptionFallbacks: Readonly<Record<string, string>> = {
    Anthropologist: 'You have spent years studying cultures, customs, and social rituals, learning how people live and what they value.',
    Archaeologist: 'You explore ruins and lost sites, piecing together history through relics, excavation, and careful scholarship.',
    Athlete: 'You trained your body for competition and spectacle, relying on discipline, stamina, and hard-earned physical skill.',
    'City Watch': 'You served as a guard or constable, learning how to keep order, read trouble, and navigate the politics of the street.',
    'Clan Crafter': 'You were raised in a tradition of skilled labor and clan duty, where craft, reputation, and ancestry are tightly linked.',
    'Cloistered Scholar': 'You lived among libraries, tutors, and quiet halls of learning, devoting yourself to study and refined knowledge.',
    Courtier: 'You learned to navigate courts, etiquette, and shifting alliances, using tact and observation to survive among the powerful.',
    Faceless: 'You built a second life behind a crafted persona, concealing your true self behind reputation, costume, and rumor.',
    'Faction Agent': 'You work on behalf of an organized faction, carrying its goals into the world through diplomacy, secrecy, or field work.',
    'Far Traveler': 'You come from lands that feel strange and distant to the people around you, carrying foreign customs and a broad perspective.',
    Feylost: 'You were touched by the Feywild, shaped by wonder, disorientation, and memories of a place that never fully leaves you.',
    Fisher: 'You earned your living from rivers, lakes, or coasts, developing patience, practical instincts, and a steady relationship with the water.',
    'Giant Foundling': 'Your upbringing was marked by the influence of giantkind, leaving you with stories, habits, and outlooks larger than ordinary life.',
    'Haunted One': 'You carry the weight of a terrible past and move through the world marked by dread, trauma, and the will to endure.',
    'House Agent': 'You represent the interests of a powerful house, balancing loyalty, politics, and assignments that advance your patrons.',
    Inheritor: 'You received something precious or dangerous from the past, and your life is now tied to understanding, protecting, or using it.',
    'Investigator (SCAG)': 'You solve problems by following clues, reading motives, and uncovering truths hidden beneath ordinary appearances.',
    'Investigator (VRGR)': 'You pursue mysteries with sharp instincts and persistence, often in places where fear and uncertainty cloud the truth.',
    'Knight of the Order': 'You belong to a sworn order with ideals, obligations, and allies, and your training reflects service to a greater cause.',
    Marine: 'You served in harsh military conditions where endurance, discipline, and hard-won resilience meant the difference between survival and defeat.',
    Rewarded: 'You have already been recognized for a deed of importance, and that reward continues to shape your opportunities and expectations.',
    Ruined: 'Your life was broken by catastrophe, betrayal, or loss, leaving you to rebuild yourself from whatever remained.',
    'Rune Carver': 'You studied ancient runes and the craft of inscribing power into objects, blending artistry with old magical traditions.',
    Shipwright: 'You know ships from keel to mast, with practical skill in construction, repair, and the rhythm of seafaring work.',
    Smuggler: 'You moved people or goods where authorities said they should not go, relying on secrecy, nerve, and trusted routes.',
    'Urban Bounty Hunter': 'You make your living tracking people through crowded settlements, using informants, patience, and pressure to close in on your target.',
    'Uthgardt Tribe Member': 'You were raised among proud tribal traditions rooted in survival, ancestry, and the harsh strength of the frontier.',
    'Waterdhavian Noble': 'You are tied to one of Waterdeep\'s powerful families, shaped by privilege, urban politics, and public expectation.',
    'Witchlight Hand': 'You traveled with the Witchlight Carnival, learning performance, misdirection, and the strange warmth of a wandering show.',
    'Black Fist Double Agent': 'You walk a dangerous line between public service and secret allegiance, trading in information and hidden loyalties.',
    'Dragon Casualty': 'Your life was changed by draconic destruction, and you carry the scars, fear, or determination that followed in its wake.',
    'Iron Route Bandit': 'You survived by preying on trade routes, learning how to strike quickly, vanish, and live outside the law.',
    'Phlan Insurgent': 'You fought against occupation and oppression, shaped by resistance, secrecy, and the cost of rebellion.',
    'Stojanow Prisoner': 'Captivity hardened you, teaching endurance, suspicion, and the value of every chance to reclaim your freedom.',
    'Ticklebelly Nomad': 'You grew up on the move across open country, shaped by travel, community memory, and life under wide skies.',
    'Caravan Specialist': 'You worked the roads between settlements, mastering logistics, negotiation, and the practical realities of long journeys.',
    'Earthspur Miner': 'You toiled in the deep places of the earth, learning grit, caution, and the rhythms of dangerous labor underground.',
    Harborfolk: 'You belong to a waterfront community where trade, tides, and hard manual work define daily life.',
    'Mulmaster Aristocrat': 'You were raised amid rigid status, political tension, and the demanding expectations of an old and powerful city.',
    'Phlan Refugee': 'You were driven from home by conflict or disaster, carrying loss, resilience, and the determination to start again.',
    'Cormanthor Refugee': 'You fled a dangerous homeland tied to ancient forests and old conflicts, leaving with memory, caution, and survival instinct.',
    'Gate Urchin': 'You survived on the margins of the city, learning to slip through crowded spaces and make use of scraps others ignored.',
    'Hillsfar Merchant': 'You built your life around trade, bargaining, and the risks of doing business in an unforgiving region.',
    'Hillsfar Smuggler': 'You survived through illicit transport and quiet deals, building connections where law and profit collided.',
    'Secret Identity': 'You maintain a carefully protected second identity, balancing appearances with the constant risk of exposure.',
    'Shade Fanatic': 'You devoted yourself to a dark and consuming cause, shaped by zeal, secrecy, and the influence of shadowed powers.',
    'Trade Sheriff': 'You kept commerce routes secure through authority, enforcement, and the practical management of restless frontiers.',
    "Celebrity Adventurer's Scion": 'You grew up in the orbit of famous adventurers, inheriting public attention, high expectations, and stories larger than life.',
    'Failed Merchant': 'A collapsed business or bad deal forced you to adapt, leaving you with hard lessons about risk, ambition, and survival.',
    Gambler: 'You live by instinct, nerve, and calculated risk, always reading the table for opportunity or danger.',
    Plaintiff: 'You were drawn into legal conflict and learned to survive through persistence, testimony, and understanding institutions of power.',
    'Rival Intern': 'You come from a competitive environment where ambition, comparison, and the need to prove yourself shaped your outlook.',
    Dissenter: 'You stood apart from the beliefs or structures around you, defined by refusal, conviction, and the cost of opposing the norm.',
    Initiate: 'You began formal training within a sacred, mystical, or institutional tradition, learning its rites, rules, and expectations.',
    Vizier: 'You advised rulers or powerful figures, using intellect, planning, and political awareness to shape decisions behind the scenes.',
    'Knight of Solamnia': 'You were trained in a storied chivalric tradition that prizes honor, discipline, and service to a noble ideal.',
    'Mage of High Sorcery': 'You were shaped by an exacting magical order, where study, discipline, and allegiance define the practice of arcane power.',
    Inquisitor: 'You are trained to question, uncover, and press for truth, using scrutiny and resolve to expose what others hide.',
    'Gate Warden': 'You guard thresholds between places or powers, living with duty, vigilance, and the burden of keeping danger at bay.',
    'Planar Philosopher': 'Your travels and studies widened your view beyond one world, making you thoughtful, curious, and strangely hard to surprise.',
    'Azorius Functionary': 'You served a vast legal bureaucracy, learning procedure, administration, and the power of systems and precedent.',
    'Boros Legionnaire': 'You were forged in a militant order that values discipline, courage, and righteous action in the face of danger.',
    'Dimir Operative': 'You worked in shadows and secrets, where misinformation, hidden motives, and careful manipulation are everyday tools.',
    'Golgari Agent': 'You come from a culture of decay, survival, and renewal, where resilience matters more than appearances.',
    'Gruul Anarch': 'You reject imposed order and thrive on freedom, fury, and the raw strength of untamed community.',
    'Izzet Engineer': 'You belong to a culture of magical innovation, reckless experimentation, and brilliant problem solving.',
    'Orzhov Representative': 'You were shaped by a hierarchy of wealth, obligation, and spiritual debt, where favors and power are tightly entwined.',
    'Rakdos Cultist': 'You embraced spectacle, excess, and danger, finding identity in performance that shocks, terrifies, and enthralls.',
    'Selesnya Initiate': 'You were raised in a collective that values harmony, devotion, and purpose shared across a greater whole.',
    'Simic Scientist': 'You pursue adaptation and magical biology, viewing the world through experimentation, change, and evolving design.',
    'Lorehold Student': 'You study the echoes of history through magic, memory, and the stories left behind by great deeds.',
    'Prismari Student': 'Your training blends elemental magic with artistic expression, shaping you to create as much as to cast.',
    'Quandrix Student': 'You see magic through patterns, numbers, and elegant abstractions, trusting structure to reveal deeper truths.',
    'Silverquill Student': 'You were trained to wield language as art and weapon, combining rhetoric, style, and magical expression.',
    'Witherbloom Student': 'You study the cycle of life and decay, drawing strength from harsh truths, instinct, and natural vitality.',
    Grinner: 'You move through society as a performer and secret ally, using charm, wit, and quiet influence to protect others.',
    'Volstrucker Agent': 'You were trained for covert service under a ruthless regime, where obedience, secrecy, and precision were essential.',
    'Astral Drifter': 'You have spent time among the stars and the planes beyond, returning with a perspective shaped by cosmic distance.',
    Wildspacer: 'You grew up amid spelljamming travel and strange horizons, comfortable with danger, wonder, and life between worlds.',
    Ashari: 'You were raised among guardians of elemental balance, shaped by duty, restraint, and reverence for primal forces.'
};

export const backgroundSkillProficienciesFallbacks: Readonly<Record<string, string>> = {
    Acolyte: 'Insight, Religion',
    Anthropologist: 'Insight, Religion',
    Archaeologist: 'History, Survival',
    Artisan: 'Insight, Persuasion',
    Athlete: 'Acrobatics, Athletics',
    Charlatan: 'Deception, Sleight of Hand',
    'City Watch': 'Athletics, Insight',
    'Clan Crafter': 'History, Insight',
    'Cloistered Scholar': 'History, Arcana',
    Courtier: 'Insight, Persuasion',
    Criminal: 'Stealth, Sleight of Hand',
    Entertainer: 'Acrobatics, Performance',
    Faceless: 'Deception, Intimidation',
    'Faction Agent': 'Insight, Perception',
    'Far Traveler': 'Insight, Perception',
    Farmer: 'Animal Handling, Nature',
    Feylost: 'Deception, Survival',
    Fisher: 'History, Survival',
    'Folk Hero': 'Animal Handling, Survival',
    Gambler: 'Deception, Insight',
    Gladiator: 'Acrobatics, Performance',
    'Giant Foundling': 'Intimidation, Survival',
    'Guild Artisan': 'Insight, Persuasion',
    'Guild Merchant': 'Insight, Persuasion',
    'Haunted One': 'Arcana, Investigation',
    Hermit: 'Medicine, Religion',
    'House Agent': 'Investigation, Persuasion',
    Inheritor: 'Survival, History',
    'Investigator (SCAG)': 'Deception, Insight',
    'Investigator (VRGR)': 'Insight, Investigation',
    Knight: 'Athletics, Survival',
    'Knight of the Order': 'Persuasion, History',
    'Knight of Solamnia': 'Athletics, Survival',
    Marine: 'Athletics, Survival',
    'Mercenary Veteran': 'Athletics, Persuasion',
    Noble: 'History, Persuasion',
    Outlander: 'Athletics, Survival',
    Pirate: 'Athletics, Perception',
    Rewarded: 'Insight, Persuasion',
    Ruined: 'Stealth, Survival',
    'Rune Carver': 'History, Perception',
    Sage: 'Arcana, History',
    Sailor: 'Athletics, Perception',
    Shipwright: 'History, Perception',
    Smuggler: 'Athletics, Deception',
    Soldier: 'Athletics, Intimidation',
    Spy: 'Deception, Stealth',
    'Urban Bounty Hunter': 'Deception, Insight',
    Urchin: 'Sleight of Hand, Stealth',
    'Uthgardt Tribe Member': 'Athletics, Survival',
    'Waterdhavian Noble': 'History, Persuasion',
    'Witchlight Hand': 'Performance, Sleight of Hand',
    'Black Fist Double Agent': 'Deception, Insight',
    'Dragon Casualty': 'Intimidation, Survival',
    'Iron Route Bandit': 'Stealth, Animal Handling',
    'Phlan Insurgent': 'Stealth, Survival',
    'Stojanow Prisoner': 'Deception, Perception',
    'Ticklebelly Nomad': 'Nature, Animal Handling',
    'Caravan Specialist': 'Animal Handling, Survival',
    'Earthspur Miner': 'Athletics, Survival',
    Harborfolk: 'Athletics, Sleight of Hand',
    'Mulmaster Aristocrat': 'Deception, Performance',
    'Phlan Refugee': 'Insight, Athletics',
    'Cormanthor Refugee': 'Nature, Survival',
    'Gate Urchin': 'Deception, Sleight of Hand',
    'Hillsfar Merchant': 'Insight, Persuasion',
    'Hillsfar Smuggler': 'Perception, Stealth',
    'Secret Identity': 'Deception, Stealth',
    'Shade Fanatic': 'Deception, Intimidation',
    'Trade Sheriff': 'Investigation, Persuasion',
    'Celebrity Adventurer\'s Scion': 'Perception, Performance',
    'Failed Merchant': 'Investigation, Persuasion',
    Plaintiff: 'Medicine, Persuasion',
    'Rival Intern': 'History, Investigation',
    Dissenter: 'Deception, Insight',
    Initiate: 'Athletics, Intimidation',
    Vizier: 'History, Religion',
    Inquisitor: 'Investigation, Religion',
    'Gate Warden': 'Persuasion, Survival',
    'Planar Philosopher': 'Arcana, Insight',
    'Azorius Functionary': 'Insight, Intimidation',
    'Boros Legionnaire': 'Athletics, Intimidation',
    'Dimir Operative': 'Deception, Stealth',
    'Golgari Agent': 'Nature, Survival',
    'Gruul Anarch': 'Animal Handling, Athletics',
    'Izzet Engineer': 'Arcana, Investigation',
    'Orzhov Representative': 'Intimidation, Religion',
    'Rakdos Cultist': 'Acrobatics, Performance',
    'Selesnya Initiate': 'Nature, Persuasion',
    'Simic Scientist': 'Arcana, Medicine',
    'Lorehold Student': 'History, Religion',
    'Prismari Student': 'Acrobatics, Performance',
    'Quandrix Student': 'Arcana, Nature',
    'Silverquill Student': 'Intimidation, Persuasion',
    'Witherbloom Student': 'Nature, Survival',
    Grinner: 'Deception, Performance',
    'Volstrucker Agent': 'Deception, Stealth',
    'Astral Drifter': 'Insight, Religion',
    Wildspacer: 'Athletics, Survival',
    'Mage of High Sorcery': 'Arcana, History',
    Ashari: 'Nature, Survival'
};

export const backgroundToolProficienciesFallbacks: Readonly<Record<string, string>> = {
    Acolyte: 'Calligrapher\'s supplies',
    Anthropologist: 'None',
    Archaeologist: 'Cartographer\'s tools or navigator\'s tools',
    Artisan: 'One type of artisan\'s tools',
    Athlete: 'Vehicles (Land)',
    Charlatan: 'Disguise kit, forgery kit',
    'City Watch': 'None',
    'Clan Crafter': 'One type of artisan\'s tools',
    'Cloistered Scholar': 'None',
    Courtier: 'None',
    Criminal: 'Thieves\' tools',
    Entertainer: 'Disguise kit, one type of musical instrument',
    Faceless: 'Disguise kit',
    'Faction Agent': 'None',
    'Far Traveler': 'One type of musical instrument',
    Farmer: 'One type of artisan\'s tools',
    Feylost: 'One type of musical instrument',
    Fisher: 'None',
    'Folk Hero': 'One type of artisan\'s tools',
    Gambler: 'One type of gaming set',
    Gladiator: 'None',
    'Giant Foundling': 'None',
    'Guild Artisan': 'One type of artisan\'s tools',
    'Guild Merchant': 'Navigator\'s tools',
    'Haunted One': 'None',
    Hermit: 'Herbalism kit',
    'House Agent': 'Two proficiencies from House Tool Proficiencies table',
    Inheritor: 'One type of gaming set or musical instrument',
    'Investigator (SCAG)': 'Disguise kit, thieves\' tools',
    'Investigator (VRGR)': 'Disguise kit, thieves\' tools',
    Knight: 'One type of gaming set',
    'Knight of the Order': 'One type of gaming set or musical instrument',
    'Knight of Solamnia': 'None',
    Marine: 'Vehicles (land & water)',
    'Mercenary Veteran': 'One type of gaming set',
    Noble: 'One type of gaming set',
    Outlander: 'One type of musical instrument',
    Pirate: 'Navigator\'s tools',
    Rewarded: 'One type of gaming set',
    Ruined: 'One type of gaming set',
    'Rune Carver': 'One type of artisan\'s tools',
    Sage: 'None',
    Sailor: 'Navigator\'s tools',
    Shipwright: 'Carpenter\'s tools',
    Smuggler: 'None',
    Soldier: 'One type of gaming set',
    Spy: 'Thieves\' tools, disguise kit',
    'Urban Bounty Hunter': 'One type of gaming set, one musical instrument, or thieves\' tools',
    Urchin: 'Disguise kit, thieves\' tools',
    'Uthgardt Tribe Member': 'One type of musical instrument or artisan\'s tools',
    'Waterdhavian Noble': 'One type of gaming set or musical instrument',
    'Witchlight Hand': 'Disguise kit',
    'Black Fist Double Agent': 'Disguise kit, one type of artisan\'s tools or gaming set',
    'Dragon Casualty': 'Varies by origin',
    'Iron Route Bandit': 'One type of gaming set',
    'Phlan Insurgent': 'One type of artisan\'s tools',
    'Stojanow Prisoner': 'One type of gaming set, thieves\' tools',
    'Ticklebelly Nomad': 'Herbalism kit',
    'Caravan Specialist': 'Vehicles (Land)',
    'Earthspur Miner': 'None',
    Harborfolk: 'One type of gaming set',
    'Mulmaster Aristocrat': 'One type of artisan\'s tools, one type of musical instrument',
    'Phlan Refugee': 'One type of artisan\'s tools',
    'Cormanthor Refugee': 'One type of artisan\'s tools',
    'Gate Urchin': 'Thieves\' tools, one type of musical instrument',
    'Hillsfar Merchant': 'Vehicles (land & water)',
    'Hillsfar Smuggler': 'Forgery kit',
    'Secret Identity': 'Disguise kit, forgery kit',
    'Shade Fanatic': 'Forgery kit',
    'Trade Sheriff': 'Thieves\' tools',
    'Celebrity Adventurer\'s Scion': 'Disguise kit',
    'Failed Merchant': 'One type of artisan\'s tools',
    Plaintiff: 'One type of artisan\'s tools',
    'Rival Intern': 'One type of artisan\'s tools',
    Dissenter: 'None',
    Initiate: 'One type of gaming set',
    Vizier: 'One type of artisan\'s tools, one type of musical instrument',
    Inquisitor: 'Thieves\' tools, one type of artisan\'s tools',
    'Gate Warden': 'None',
    'Planar Philosopher': 'None',
    'Azorius Functionary': 'None',
    'Boros Legionnaire': 'One type of gaming set',
    'Dimir Operative': 'Disguise kit',
    'Golgari Agent': 'Poisoner\'s kit',
    'Gruul Anarch': 'Herbalism kit',
    'Izzet Engineer': 'One type of artisan\'s tools',
    'Orzhov Representative': 'None',
    'Rakdos Cultist': 'One type of musical instrument',
    'Selesnya Initiate': 'One type of artisan\'s tools or musical instrument',
    'Simic Scientist': 'None',
    'Lorehold Student': 'None',
    'Prismari Student': 'One type of musical instrument or artisan\'s tools',
    'Quandrix Student': 'One type of artisan\'s tools',
    'Silverquill Student': 'None',
    'Witherbloom Student': 'Herbalism kit',
    Grinner: 'One type of musical instrument, thieves\' tools',
    'Volstrucker Agent': 'Poisoner\'s kit',
    'Astral Drifter': 'None',
    Wildspacer: 'Navigator\'s tools',
    'Mage of High Sorcery': 'None',
    Ashari: 'Herbalism kit'
};

export const backgroundLanguagesFallbacks: Readonly<Record<string, string>> = {
    Acolyte: 'Two of your choice',
    Anthropologist: 'Two of your choice',
    Archaeologist: 'One of your choice',
    Artisan: 'One of your choice',
    Athlete: 'One of your choice',
    Charlatan: 'None',
    'City Watch': 'Two of your choice',
    'Clan Crafter': 'Dwarvish or one other of your choice',
    'Cloistered Scholar': 'Two of your choice',
    Courtier: 'Two of your choice',
    Criminal: 'None',
    Entertainer: 'None',
    Faceless: 'One of your choice',
    'Faction Agent': 'Two of your choice',
    'Far Traveler': 'Any one of your choice',
    Farmer: 'None',
    Feylost: 'One from Elvish, Gnomish, Goblin, or Sylvan',
    Fisher: 'One of your choice',
    'Folk Hero': 'None',
    Gambler: 'Any one of your choice',
    Gladiator: 'None',
    'Giant Foundling': 'Giant and one other language of your choice',
    'Guild Artisan': 'One of your choice',
    'Guild Merchant': 'One of your choice',
    'Haunted One': 'Two of your choice, one exotic',
    Hermit: 'One of your choice',
    'House Agent': 'None',
    Inheritor: 'Any one of your choice',
    'Investigator (SCAG)': 'None',
    'Investigator (VRGR)': 'None',
    Knight: 'None',
    'Knight of the Order': 'One of your choice',
    'Knight of Solamnia': 'Two of your choice',
    Marine: 'None',
    'Mercenary Veteran': 'None',
    Noble: 'One of your choice',
    Outlander: 'One of your choice',
    Pirate: 'None',
    Rewarded: 'One of your choice',
    Ruined: 'One of your choice',
    'Rune Carver': 'Giant',
    Sage: 'Two of your choice',
    Sailor: 'None',
    Shipwright: 'None',
    Smuggler: 'None',
    Soldier: 'None',
    Spy: 'None',
    'Urban Bounty Hunter': 'None',
    Urchin: 'None',
    'Uthgardt Tribe Member': 'One of your choice',
    'Waterdhavian Noble': 'One of your choice',
    'Witchlight Hand': 'One of your choice',
    'Black Fist Double Agent': 'None',
    'Dragon Casualty': 'Draconic',
    'Iron Route Bandit': 'None',
    'Phlan Insurgent': 'None',
    'Stojanow Prisoner': 'None',
    'Ticklebelly Nomad': 'Giant',
    'Caravan Specialist': 'One of your choice',
    'Earthspur Miner': 'Dwarven and Undercommon',
    Harborfolk: 'None',
    'Mulmaster Aristocrat': 'None',
    'Phlan Refugee': 'One of your choice',
    'Cormanthor Refugee': 'Elven',
    'Gate Urchin': 'None',
    'Hillsfar Merchant': 'None',
    'Hillsfar Smuggler': 'One racial language',
    'Secret Identity': 'None',
    'Shade Fanatic': 'Netherese',
    'Trade Sheriff': 'Elven',
    'Celebrity Adventurer\'s Scion': 'Two of your choice',
    'Failed Merchant': 'Any one of your choice',
    Plaintiff: 'Any one of your choice',
    'Rival Intern': 'Any one of your choice',
    Dissenter: 'None',
    Initiate: 'None',
    Vizier: 'None',
    Inquisitor: 'None',
    'Gate Warden': 'Two of your choice',
    'Planar Philosopher': 'Two of your choice',
    'Azorius Functionary': 'Two of your choice',
    'Boros Legionnaire': 'One from Celestial, Draconic, Goblin, or Minotaur',
    'Dimir Operative': 'One of your choice',
    'Golgari Agent': 'One from Elvish, Giant, or Kraul',
    'Gruul Anarch': 'One from Draconic, Giant, Goblin, or Sylvan',
    'Izzet Engineer': 'One from Draconic, Goblin, or Vedalken',
    'Orzhov Representative': 'Two of your choice',
    'Rakdos Cultist': 'One from Abyssal or Giant',
    'Selesnya Initiate': 'One from Elvish, Loxodon, or Sylvan',
    'Simic Scientist': 'Two of your choice',
    'Lorehold Student': 'Two of your choice',
    'Prismari Student': 'One of your choice',
    'Quandrix Student': 'One of your choice',
    'Silverquill Student': 'Two of your choice',
    'Witherbloom Student': 'One of your choice',
    Grinner: 'None',
    'Volstrucker Agent': 'One of your choice',
    'Astral Drifter': 'Two of your choice',
    Wildspacer: 'None',
    'Mage of High Sorcery': 'Two of your choice',
    Ashari: 'Primordial (Aquan, Auran, Ignan, or Terran)'
};

export const backgroundDetailOverrides: Record<string, Omit<BackgroundDetail, 'sourceUrl'>> = {
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
    },
    Charlatan: {
        description: 'You learned to survive on forged identities, clever lies, and quick sleight of hand in crowded streets and dangerous courts.',
        skillProficiencies: 'Deception, Sleight of Hand',
        toolProficiencies: 'Disguise Kit, Forgery Kit',
        languages: 'None',
        choices: [
            {
                key: 'charlatan-favorite-scam',
                title: 'Favorite Scam',
                subtitle: '1 Choice',
                options: ['Cheater', 'Forgery', 'Con Artist', 'Disguises', 'False Identity', 'Street Hustler']
            },
            {
                key: 'charlatan-feature',
                title: 'False Identity',
                subtitle: 'Background Feature',
                options: ['Merchant Persona', 'Performer Persona', 'Noble Persona']
            },
            {
                key: 'ability-scores',
                title: 'Ability Scores',
                subtitle: '1 Choice',
                options: ['Increase three scores (+1 / +1 / +1)', 'Increase two scores (+2 / +1)']
            }
        ]
    },
    Entertainer: {
        description: 'You performed for crowds, blending artistry, confidence, and social instinct to captivate any room.',
        skillProficiencies: 'Acrobatics, Performance',
        toolProficiencies: 'Disguise Kit, One Musical Instrument',
        languages: 'None',
        choices: [
            {
                key: 'entertainer-routine',
                title: 'Entertainer Routine',
                subtitle: '1 Choice',
                options: ['Actor', 'Dancer', 'Fire-Eater', 'Jester', 'Juggler', 'Instrumentalist', 'Poet', 'Storyteller', 'Singer']
            },
            {
                key: 'entertainer-instrument',
                title: 'Instrument Proficiency',
                subtitle: 'Choose 1 type',
                options: ['Lute', 'Flute', 'Drum', 'Lyre', 'Horn', 'Pan Flute', 'Viol']
            },
            {
                key: 'ability-scores',
                title: 'Ability Scores',
                subtitle: '1 Choice',
                options: ['Increase three scores (+1 / +1 / +1)', 'Increase two scores (+2 / +1)']
            }
        ]
    },
    Gladiator: {
        description: 'You earned fame and coin in brutal arenas, turning athletic spectacle into survival and reputation.',
        skillProficiencies: 'Acrobatics, Performance',
        toolProficiencies: 'Disguise Kit, One Musical Instrument',
        languages: 'None',
        choices: [
            {
                key: 'gladiator-style',
                title: 'Arena Style',
                subtitle: '1 Choice',
                options: ['Duelist', 'Wrestler', 'Mounted Star', 'Weapon Specialist']
            },
            {
                key: 'gladiator-feature',
                title: 'By Popular Demand',
                subtitle: 'Background Feature',
                options: ['Arena Celebrity', 'Traveling Performer', 'Underground Champion']
            },
            {
                key: 'ability-scores',
                title: 'Ability Scores',
                subtitle: '1 Choice',
                options: ['Increase three scores (+1 / +1 / +1)', 'Increase two scores (+2 / +1)']
            }
        ]
    },
    'Folk Hero': {
        description: 'You rose from ordinary roots through bravery and practical service, becoming a trusted champion of common people.',
        skillProficiencies: 'Animal Handling, Survival',
        toolProficiencies: 'One Artisan\'s Tools, Vehicles (Land)',
        languages: 'None',
        choices: [
            {
                key: 'folk-hero-defining-event',
                title: 'Defining Event',
                subtitle: '1 Choice',
                options: ['Stood Against a Tyrant', 'Defended a Village', 'Survived a Disaster', 'Led a Rebellion']
            },
            {
                key: 'folk-hero-feature',
                title: 'Rustic Hospitality',
                subtitle: 'Background Feature',
                options: ['Village Networks', 'Farmstead Shelter', 'Traveling Goodwill']
            },
            {
                key: 'ability-scores',
                title: 'Ability Scores',
                subtitle: '1 Choice',
                options: ['Increase three scores (+1 / +1 / +1)', 'Increase two scores (+2 / +1)']
            }
        ]
    },
    'Guild Artisan': {
        description: 'You trained in a trade guild, mastering craft standards, negotiation, and professional community ties.',
        skillProficiencies: 'Insight, Persuasion',
        toolProficiencies: 'One Artisan\'s Tools',
        languages: 'One of your choice',
        choices: [
            {
                key: 'guild-artisan-trade',
                title: 'Guild Specialty',
                subtitle: 'Choose a trade',
                options: ['Brewer', 'Carpenter', 'Mason', 'Smith', 'Weaver', 'Tinker', 'Jeweler']
            },
            {
                key: 'guild-artisan-language',
                title: 'Guild Language',
                subtitle: 'Choose 1 language',
                options: ['Dwarvish', 'Elvish', 'Gnomish', 'Draconic', 'Infernal', 'Sylvan']
            },
            {
                key: 'ability-scores',
                title: 'Ability Scores',
                subtitle: '1 Choice',
                options: ['Increase three scores (+1 / +1 / +1)', 'Increase two scores (+2 / +1)']
            }
        ]
    },
    'Guild Merchant': {
        description: 'You worked commercial routes and guild contracts, turning market knowledge into influence and profit.',
        skillProficiencies: 'Insight, Persuasion',
        toolProficiencies: 'Navigator\'s Tools',
        languages: 'One of your choice',
        choices: [
            {
                key: 'guild-merchant-specialty',
                title: 'Trade Focus',
                subtitle: '1 Choice',
                options: ['Caravan Logistics', 'Exotic Imports', 'Regional Broker', 'Maritime Trade']
            },
            {
                key: 'guild-merchant-language',
                title: 'Merchant Language',
                subtitle: 'Choose 1 language',
                options: ['Dwarvish', 'Elvish', 'Gnomish', 'Draconic', 'Infernal', 'Sylvan']
            },
            {
                key: 'ability-scores',
                title: 'Ability Scores',
                subtitle: '1 Choice',
                options: ['Increase three scores (+1 / +1 / +1)', 'Increase two scores (+2 / +1)']
            }
        ]
    },
    Hermit: {
        description: 'You withdrew from society to pursue solitude, contemplation, and truths hidden from bustling civilization.',
        skillProficiencies: 'Medicine, Religion',
        toolProficiencies: 'Herbalism Kit',
        languages: 'One of your choice',
        choices: [
            {
                key: 'hermit-discovery',
                title: 'Discovery',
                subtitle: 'Background Feature',
                options: ['Ancient Secret', 'Prophetic Vision', 'Hidden Lore', 'Spiritual Revelation']
            },
            {
                key: 'hermit-language',
                title: 'Study Language',
                subtitle: 'Choose 1 language',
                options: ['Celestial', 'Draconic', 'Druidic', 'Infernal', 'Sylvan', 'Undercommon']
            },
            {
                key: 'ability-scores',
                title: 'Ability Scores',
                subtitle: '1 Choice',
                options: ['Increase three scores (+1 / +1 / +1)', 'Increase two scores (+2 / +1)']
            }
        ]
    },
    Outlander: {
        description: 'You are shaped by the wilds and long travel, with practical survival instincts and regional lore.',
        skillProficiencies: 'Athletics, Survival',
        toolProficiencies: 'One Musical Instrument',
        languages: 'One of your choice',
        choices: [
            {
                key: 'outlander-origin',
                title: 'Origin Region',
                subtitle: '1 Choice',
                options: ['Forests', 'Mountains', 'Coast', 'Desert', 'Arctic', 'Plains']
            },
            {
                key: 'outlander-feature',
                title: 'Wanderer',
                subtitle: 'Background Feature',
                options: ['Navigator of Wilds', 'Forager', 'Trailblazer']
            },
            {
                key: 'ability-scores',
                title: 'Ability Scores',
                subtitle: '1 Choice',
                options: ['Increase three scores (+1 / +1 / +1)', 'Increase two scores (+2 / +1)']
            }
        ]
    },
    Sage: {
        description: 'You dedicated your life to study, archives, and difficult questions, building deep expertise in lore.',
        skillProficiencies: 'Arcana, History',
        toolProficiencies: 'None',
        languages: 'Two of your choice',
        choices: [
            {
                key: 'sage-specialty',
                title: 'Research Specialty',
                subtitle: '1 Choice',
                options: ['Astronomy', 'Alchemy', 'Engineering', 'History', 'Religion', 'Magic Theory']
            },
            {
                key: 'sage-feature',
                title: 'Researcher',
                subtitle: 'Background Feature',
                options: ['Library Networks', 'Scholarly Correspondence', 'Academic Authority']
            },
            {
                key: 'ability-scores',
                title: 'Ability Scores',
                subtitle: '1 Choice',
                options: ['Increase three scores (+1 / +1 / +1)', 'Increase two scores (+2 / +1)']
            }
        ]
    },
    Sailor: {
        description: 'You spent your life at sea, mastering ship routines, weather intuition, and maritime discipline.',
        skillProficiencies: 'Athletics, Perception',
        toolProficiencies: 'Navigator\'s Tools, Vehicles (Water)',
        languages: 'None',
        choices: [
            {
                key: 'sailor-role',
                title: 'Shipboard Role',
                subtitle: '1 Choice',
                options: ['Deckhand', 'Helmsman', 'Boatswain', 'Lookout', 'Quartermaster']
            },
            {
                key: 'sailor-feature',
                title: 'Ship\'s Passage',
                subtitle: 'Background Feature',
                options: ['Merchant Route Access', 'Naval Contacts', 'Smuggler Channels']
            },
            {
                key: 'ability-scores',
                title: 'Ability Scores',
                subtitle: '1 Choice',
                options: ['Increase three scores (+1 / +1 / +1)', 'Increase two scores (+2 / +1)']
            }
        ]
    },
    Pirate: {
        description: 'You lived by daring raids and dangerous waters, relying on fearsome reputation and seamanship.',
        skillProficiencies: 'Athletics, Perception',
        toolProficiencies: 'Navigator\'s Tools, Vehicles (Water)',
        languages: 'None',
        choices: [
            {
                key: 'pirate-crew-role',
                title: 'Pirate Crew Role',
                subtitle: '1 Choice',
                options: ['Boarding Specialist', 'Gunner', 'Navigator', 'Quartermaster']
            },
            {
                key: 'pirate-feature',
                title: 'Bad Reputation',
                subtitle: 'Background Feature',
                options: ['Infamous Name', 'Feared Colors', 'Hidden Safe Harbors']
            },
            {
                key: 'ability-scores',
                title: 'Ability Scores',
                subtitle: '1 Choice',
                options: ['Increase three scores (+1 / +1 / +1)', 'Increase two scores (+2 / +1)']
            }
        ]
    },
    Soldier: {
        description: 'You served in a military structure, trained for discipline, tactics, and life under command.',
        skillProficiencies: 'Athletics, Intimidation',
        toolProficiencies: 'One type of Gaming Set, Vehicles (Land)',
        languages: 'None',
        choices: [
            {
                key: 'soldier-specialty',
                title: 'Military Specialty',
                subtitle: '1 Choice',
                options: ['Infantry', 'Scout', 'Cavalry', 'Officer', 'Quartermaster', 'Siege Engineer']
            },
            {
                key: 'soldier-feature',
                title: 'Military Rank',
                subtitle: 'Background Feature',
                options: ['Active Commission', 'Retired Veteran', 'Mercenary Commander']
            },
            {
                key: 'ability-scores',
                title: 'Ability Scores',
                subtitle: '1 Choice',
                options: ['Increase three scores (+1 / +1 / +1)', 'Increase two scores (+2 / +1)']
            }
        ]
    },
    'Mercenary Veteran': {
        description: 'You fought for coin in formal contracts, balancing battlefield practicality with negotiation and reputation.',
        skillProficiencies: 'Athletics, Intimidation',
        toolProficiencies: 'One type of Gaming Set, Vehicles (Land)',
        languages: 'None',
        choices: [
            {
                key: 'mercenary-company',
                title: 'Company Legacy',
                subtitle: '1 Choice',
                options: ['Elite Company', 'Infamous Freeblades', 'Regional Contract Guard']
            },
            {
                key: 'mercenary-feature',
                title: 'Mercenary Life',
                subtitle: 'Background Feature',
                options: ['Contract Networks', 'Veteran Camaraderie', 'Campaign Logistics']
            },
            {
                key: 'ability-scores',
                title: 'Ability Scores',
                subtitle: '1 Choice',
                options: ['Increase three scores (+1 / +1 / +1)', 'Increase two scores (+2 / +1)']
            }
        ]
    },
    Urchin: {
        description: 'You grew up navigating city streets with stealth, quick hands, and hard-won neighborhood instincts.',
        skillProficiencies: 'Sleight of Hand, Stealth',
        toolProficiencies: 'Disguise Kit, Thieves\' Tools',
        languages: 'None',
        choices: [
            {
                key: 'urchin-city-sector',
                title: 'Street Territory',
                subtitle: '1 Choice',
                options: ['Docks', 'Markets', 'Slums', 'Guild Quarter', 'Temple District']
            },
            {
                key: 'urchin-feature',
                title: 'City Secrets',
                subtitle: 'Background Feature',
                options: ['Hidden Paths', 'Underground Contacts', 'Safehouse Network']
            },
            {
                key: 'ability-scores',
                title: 'Ability Scores',
                subtitle: '1 Choice',
                options: ['Increase three scores (+1 / +1 / +1)', 'Increase two scores (+2 / +1)']
            }
        ]
    },
    Spy: {
        description: 'You specialized in covert information work, blending misdirection, theft, and clandestine communication.',
        skillProficiencies: 'Stealth, Sleight of Hand',
        toolProficiencies: 'Thieves\' Tools',
        languages: 'None',
        choices: [
            {
                key: 'spy-specialty',
                title: 'Spy Specialty',
                subtitle: '1 Choice',
                options: ['Infiltrator', 'Courier', 'Cipher Analyst', 'Counterintelligence']
            },
            {
                key: 'spy-feature',
                title: 'Criminal Contact',
                subtitle: 'Background Feature',
                options: ['Guild Contact', 'Court Contact', 'Military Contact']
            },
            {
                key: 'ability-scores',
                title: 'Ability Scores',
                subtitle: '1 Choice',
                options: ['Increase three scores (+1 / +1 / +1)', 'Increase two scores (+2 / +1)']
            }
        ]
    },
    Knight: {
        description: 'You are tied to landed duty and noble expectations, trained for command, protocol, and mounted service.',
        skillProficiencies: 'History, Persuasion',
        toolProficiencies: 'One type of gaming set',
        languages: 'One of your choice',
        choices: [
            {
                key: 'knight-order',
                title: 'Knightly Tradition',
                subtitle: '1 Choice',
                options: ['Feudal Banneret', 'Religious Order', 'Tournament Champion']
            },
            {
                key: 'knight-feature',
                title: 'Retainers',
                subtitle: 'Background Feature',
                options: ['Household Escort', 'Squire & Attendants', 'Regional Household']
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

export const backgroundOptions: ReadonlyArray<{ name: string; url: string }> = [
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
    { name: 'Gladiator', url: 'https://dnd5e.wikidot.com/background:entertainer#toc1' },
    { name: 'Guild Artisan', url: 'https://dnd5e.wikidot.com/background:guild-artisan' },
    { name: 'Guild Merchant', url: 'https://dnd5e.wikidot.com/background:guild-artisan#toc1' },
    { name: 'Haunted One', url: 'https://dnd5e.wikidot.com/background:haunted-one' },
    { name: 'Hermit', url: 'https://dnd5e.wikidot.com/background:hermit' },
    { name: 'House Agent', url: 'https://dnd5e.wikidot.com/background:house-agent' },
    { name: 'Inheritor', url: 'https://dnd5e.wikidot.com/background:inheritor' },
    { name: 'Investigator (SCAG)', url: 'https://dnd5e.wikidot.com/background:investigator' },
    { name: 'Investigator (VRGR)', url: 'https://dnd5e.wikidot.com/background:investigator' },
    { name: 'Knight', url: 'https://dnd5e.wikidot.com/background:noble#toc1' },
    { name: 'Knight of the Order', url: 'https://dnd5e.wikidot.com/background:knight-of-the-order' },
    { name: 'Marine', url: 'https://dnd5e.wikidot.com/background:marine' },
    { name: 'Mercenary Veteran', url: 'https://dnd5e.wikidot.com/background:mercenary-veteran' },
    { name: 'Noble', url: 'https://dnd5e.wikidot.com/background:noble' },
    { name: 'Outlander', url: 'https://dnd5e.wikidot.com/background:outlander' },
    { name: 'Pirate', url: 'https://dnd5e.wikidot.com/background:sailor#toc1' },
    { name: 'Rewarded', url: 'https://dnd5e.wikidot.com/background:rewarded' },
    { name: 'Ruined', url: 'https://dnd5e.wikidot.com/background:ruined' },
    { name: 'Rune Carver', url: 'https://dnd5e.wikidot.com/background:rune-carver' },
    { name: 'Sage', url: 'https://dnd5e.wikidot.com/background:sage' },
    { name: 'Sailor', url: 'https://dnd5e.wikidot.com/background:sailor' },
    { name: 'Shipwright', url: 'https://dnd5e.wikidot.com/background:shipwright' },
    { name: 'Smuggler', url: 'https://dnd5e.wikidot.com/background:smuggler' },
    { name: 'Soldier', url: 'https://dnd5e.wikidot.com/background:soldier' },
    { name: 'Spy', url: 'https://dnd5e.wikidot.com/background:criminal#toc1' },
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

