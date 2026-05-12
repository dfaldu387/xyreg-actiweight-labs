import { describe, it, expect } from 'vitest';
import { makeTimeScale } from './timeScale';
import { ZOOM_LEVELS } from './zoomLevels';

const MS_DAY = 86_400_000;
const MS_HOUR = 3_600_000;

describe('makeTimeScale', () => {
    describe('calendar-day visual contract', () => {
        it('rangeWidth equals pxPerDay × calendar-day count', () => {
            const start = new Date(2026, 0, 1);
            const end = new Date(2026, 0, 11); // 10 calendar days later
            const scale = makeTimeScale([start, end], 24);
            expect(scale.rangeWidth).toBe(240);
        });

        it('dateToX(start) = 0 and dateToX(end) = rangeWidth', () => {
            const start = new Date(2026, 5, 1);
            const end = new Date(2026, 5, 11);
            const scale = makeTimeScale([start, end], 50);
            expect(scale.dateToX(start)).toBe(0);
            expect(scale.dateToX(end)).toBe(500);
        });

        it('a 2-calendar-day span across US Spring-forward (2026-03-08) is exactly 2 × pxPerDay', () => {
            // The vendor bug: raw (getTime() / 86_400_000) puts this span at 1.958 days.
            const start = new Date(2026, 2, 1);
            const end = new Date(2026, 2, 31);
            const pxPerDay = 30;
            const scale = makeTimeScale([start, end], pxPerDay);
            const span = scale.dateToX(new Date(2026, 2, 9)) - scale.dateToX(new Date(2026, 2, 7));
            expect(span).toBeCloseTo(2 * pxPerDay, 5);
        });

        it('a 2-calendar-day span across US Fall-back (2025-11-02) is exactly 2 × pxPerDay', () => {
            const start = new Date(2025, 10, 1);
            const end = new Date(2025, 10, 30);
            const pxPerDay = 30;
            const scale = makeTimeScale([start, end], pxPerDay);
            const span = scale.dateToX(new Date(2025, 10, 3)) - scale.dateToX(new Date(2025, 10, 1));
            expect(span).toBeCloseTo(2 * pxPerDay, 5);
        });

        it('handles a leap day (2024-02-29) as a single calendar day', () => {
            const start = new Date(2024, 1, 1);
            const end = new Date(2024, 2, 31);
            const scale = makeTimeScale([start, end], 20);
            const feb28 = new Date(2024, 1, 28);
            const feb29 = new Date(2024, 1, 29);
            const mar1 = new Date(2024, 2, 1);
            expect(scale.dateToX(feb29) - scale.dateToX(feb28)).toBeCloseTo(20, 5);
            expect(scale.dateToX(mar1) - scale.dateToX(feb29)).toBeCloseTo(20, 5);
        });

        it('rangeWidth across a full year is exactly 365 (or 366) × pxPerDay', () => {
            const scale2025 = makeTimeScale([new Date(2025, 0, 1), new Date(2026, 0, 1)], 10);
            expect(scale2025.rangeWidth).toBe(3650);
            const scale2024 = makeTimeScale([new Date(2024, 0, 1), new Date(2025, 0, 1)], 10);
            expect(scale2024.rangeWidth).toBe(3660); // 2024 is a leap year
        });
    });

    describe('xToDate (round-trip)', () => {
        it('inverts dateToX to the same calendar day at every zoom level', () => {
            const start = new Date(2026, 0, 1);
            const end = new Date(2026, 11, 31);
            const probes = [
                new Date(2026, 0, 1),
                new Date(2026, 2, 8), // DST day
                new Date(2026, 5, 15),
                new Date(2026, 11, 30),
            ];
            for (const level of ['hour', 'day', 'week', 'month', 'quarter', 'year'] as const) {
                const scale = makeTimeScale([start, end], ZOOM_LEVELS[level].pxPerDay);
                for (const d of probes) {
                    const back = scale.xToDate(scale.dateToX(d));
                    expect(back.getFullYear()).toBe(d.getFullYear());
                    expect(back.getMonth()).toBe(d.getMonth());
                    expect(back.getDate()).toBe(d.getDate());
                }
            }
        });

        it('zoom-out then zoom-in preserves the calendar day (regression for @svar-ui year-drift)', () => {
            const start = new Date(2025, 0, 1);
            const end = new Date(2027, 0, 1);
            const day = new Date(2025, 5, 15);

            const scaleDay = makeTimeScale([start, end], ZOOM_LEVELS.day.pxPerDay);
            const scaleYear = makeTimeScale([start, end], ZOOM_LEVELS.year.pxPerDay);

            // dateToX in day-zoom → take that pixel position's "date" in day-zoom → use that date in year-zoom → round-trip.
            const dayX = scaleDay.dateToX(day);
            const dateAtDayX = scaleDay.xToDate(dayX);
            const yearX = scaleYear.dateToX(dateAtDayX);
            const dateAtYearX = scaleYear.xToDate(yearX);

            expect(dateAtYearX.getFullYear()).toBe(2025);
            expect(dateAtYearX.getMonth()).toBe(5);
            expect(dateAtYearX.getDate()).toBe(15);
        });
    });

    describe('snap', () => {
        const fullYearDomain: [Date, Date] = [new Date(2026, 0, 1), new Date(2027, 0, 1)];

        it('1-hour snap rounds to the nearest hour boundary', () => {
            const scale = makeTimeScale(fullYearDomain, 480);
            const snapped = scale.snap(new Date(2026, 0, 5, 14, 17), MS_HOUR);
            expect(snapped.getMinutes()).toBe(0);
            expect(snapped.getSeconds()).toBe(0);
            expect(snapped.getHours()).toBe(14);
        });

        it('1-day snap rounds to local midnight (DST-stable)', () => {
            const scale = makeTimeScale(fullYearDomain, 24);
            // 14:17 should round down to midnight of the same day; 14:30 should round up to next midnight.
            const a = scale.snap(new Date(2026, 0, 5, 11, 0), MS_DAY);
            expect(a.getHours()).toBe(0);
            expect(a.getMinutes()).toBe(0);
            expect(a.getDate()).toBe(5);
        });

        it('snap is idempotent (snapping twice yields the same result)', () => {
            const scale = makeTimeScale(fullYearDomain, 24);
            const probes = [
                new Date(2026, 2, 8, 5, 30), // US Spring-forward
                new Date(2025, 10, 2, 1, 30), // US Fall-back (re-domained for safety)
                new Date(2026, 5, 15, 23, 59),
            ];
            for (const d of probes) {
                const a = scale.snap(d, MS_DAY);
                const b = scale.snap(a, MS_DAY);
                expect(b.getTime()).toBe(a.getTime());
            }
        });

        it('15-minute snap honours the configured grid', () => {
            const scale = makeTimeScale(fullYearDomain, 480);
            const snapped = scale.snap(new Date(2026, 0, 5, 14, 22), 15 * 60_000);
            expect([0, 15, 30, 45]).toContain(snapped.getMinutes());
            expect(snapped.getMinutes()).toBe(15); // 22 → 15 (nearest of 15/30)
        });
    });

    describe('ticks', () => {
        it('day mode generates one tick per calendar day, inclusive', () => {
            const scale = makeTimeScale([new Date(2026, 0, 1), new Date(2026, 0, 11)], 80);
            expect(scale.ticks('day').length).toBe(11);
        });

        it('month mode generates one tick per calendar month', () => {
            const scale = makeTimeScale([new Date(2026, 0, 1), new Date(2026, 11, 1)], 6);
            expect(scale.ticks('month').length).toBe(12);
        });

        it('year mode generates one tick per calendar year', () => {
            const scale = makeTimeScale([new Date(2024, 0, 1), new Date(2027, 0, 1)], 0.7);
            expect(scale.ticks('year').length).toBe(4);
        });
    });

    describe('pxToMs / msToPx', () => {
        it('round-trip pxToMs ∘ msToPx is identity', () => {
            const scale = makeTimeScale([new Date(2026, 0, 1), new Date(2026, 11, 1)], 24);
            for (const px of [0, 1, 50, 240, 1234.5]) {
                expect(scale.msToPx(scale.pxToMs(px))).toBeCloseTo(px, 5);
            }
        });
    });
});
