import type { Race } from '../models/dungeon.models';
import { speciesInfoMap } from './new-character-standard-page.data';

function toRaceId(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function parseRaceSpeed(speedText?: string): number {
    const match = speedText?.match(/(\d+)/);
    return match ? Number(match[1]) : 30;
}

function parseRaceLanguages(name: string): string[] {
    const info = speciesInfoMap[name];
    const traitValue = info.speciesDetails?.coreTraits.find((trait) => trait.label === 'Languages')?.value
        ?? info.speciesDetails?.traitNotes.find((trait) => trait.title === 'Languages')?.details
        ?? 'Common';
    const primarySentence = traitValue.split('.')[0] ?? traitValue;

    return primarySentence
        .replace(/^You can speak, read, and write\s+/i, '')
        .replace(/^Languages:\s*/i, '')
        .split(/,|\+| and /)
        .map((language) => language.trim())
        .filter((language) => language.length > 0 && !/choice|additional|language\(s\)|species/i.test(language));
}

export const races: Race[] = Object.values(speciesInfoMap)
    .map((info) => ({
        id: toRaceId(info.name),
        name: info.name,
        abilityBonuses: {},
        traits: info.speciesDetails?.traits ?? info.highlights,
        size: info.speciesDetails?.size ?? 'Medium',
        speed: parseRaceSpeed(info.speciesDetails?.speed),
        languages: parseRaceLanguages(info.name),
        description: info.summary
    }))
    .sort((left, right) => left.name.localeCompare(right.name));

export const raceMap = new Map(races.map((race) => [race.id, race]));
