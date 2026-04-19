import { classLevelOneFeatures } from './class-features.data';
import { subclassConfigs, subclassFeatureProgressionByClass, subclassOptionsByClass } from './subclass-features.data';

describe('Barbarian subclass progression', () => {
    it('maps Path of the Berserker 2024 features to the correct levels', () => {
        const berserker = subclassFeatureProgressionByClass['Barbarian']?.['Path of the Berserker'];

        expect((berserker?.[3] as { name: string } | undefined)?.name).toBe('Frenzy');
        expect((berserker?.[6] as { name: string } | undefined)?.name).toBe('Mindless Rage');
        expect((berserker?.[10] as { name: string } | undefined)?.name).toBe('Retaliation');
        expect((berserker?.[14] as { name: string } | undefined)?.name).toBe('Intimidating Presence');
    });

    it('describes Rage Beyond Death with its real in-game benefit', () => {
        const zealot = subclassFeatureProgressionByClass['Barbarian']?.['Path of the Zealot'];
        const rageBeyondDeath = zealot?.[14] as { name: string; description: string } | undefined;

        expect(rageBeyondDeath?.name).toBe('Rage Beyond Death');
        expect(rageBeyondDeath?.description).toContain('0 hit points');
        expect(rageBeyondDeath?.description).toContain('death saving throws');
    });

    it('uses concrete mechanical summaries for other featured subclasses', () => {
        const life = subclassFeatureProgressionByClass['Cleric']?.['Life Domain']?.[3] as { description: string } | undefined;
        const champion = subclassFeatureProgressionByClass['Fighter']?.['Champion']?.[3] as { description: string } | undefined;
        const hunter = subclassFeatureProgressionByClass['Ranger']?.['Hunter']?.[3] as { description: string } | undefined;
        const evoker = (subclassFeatureProgressionByClass['Wizard']?.['School of Evocation']?.[3] as Array<{ name: string; description: string }> | undefined)?.[0];

        expect(life?.description).toContain('Hit Points');
        expect(champion?.description).toContain('19 or 20');
        expect(hunter?.description).toMatch(/1d8|extra attack/i);
        expect(evoker?.description).toContain('spellbook');
    });

    it('covers subclass milestone data for Gunslinger and Monster Hunter', () => {
        const auditedClasses = ['Gunslinger', 'Monster Hunter'] as const;

        for (const className of auditedClasses) {
            const config = subclassConfigs[className];
            expect(config).toBeDefined();

            for (const subclassName of subclassOptionsByClass[className] ?? []) {
                for (const level of config?.milestoneLevels ?? []) {
                    expect(subclassFeatureProgressionByClass[className]?.[subclassName]?.[level]).toBeDefined();
                }
            }
        }
    });

    it('keeps Blood Hunter progression populated beyond level 1', () => {
        const bloodHunterProgression = classLevelOneFeatures['Blood Hunter'] ?? [];
        const bloodHunterLevels = bloodHunterProgression.map((featureGroup) => featureGroup.level);
        const capstoneFeatures = bloodHunterProgression.find((featureGroup) => featureGroup.level === 20)?.features ?? [];

        expect(bloodHunterLevels).toContain(5);
        expect(bloodHunterLevels).toContain(20);
        expect(capstoneFeatures.some((feature) => feature.name === 'Sanguine Mastery')).toBe(true);
    });
});
