import { prisma } from "@/server/db";

/**
 * Calculates working days between startDate and finishDate inclusive (Monday to Friday),
 * excluding weekend days (Saturday & Sunday) and holidays defined in the database.
 * 
 * Example: 23 Sep 2026 (Wed) to 30 Sep 2026 (Wed) = 6 working days (Wed, Thu, Fri, Mon, Tue, Wed).
 */
export async function calculateWorkingDays(
  startDate: Date | string,
  finishDate: Date | string
): Promise<number> {
  const start = new Date(startDate);
  const finish = new Date(finishDate);

  // Normalize to midnight UTC/local
  start.setHours(0, 0, 0, 0);
  finish.setHours(0, 0, 0, 0);

  if (finish < start) return 0;

  // 1. Fetch holidays falling in the date range
  const holidays = await prisma.holiday.findMany({
    where: {
      holidayDate: {
        gte: start,
        lte: finish,
      },
    },
    select: { holidayDate: true },
  });

  const holidaySet = new Set(
    holidays.map((h) => {
      const d = new Date(h.holidayDate);
      d.setHours(0, 0, 0, 0);
      return d.toISOString().split("T")[0];
    })
  );

  let workingDays = 0;
  const current = new Date(start);

  while (current <= finish) {
    const dayOfWeek = current.getDay(); // 0 = Sunday, 6 = Saturday
    const dateStr = current.toISOString().split("T")[0];

    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = holidaySet.has(dateStr);

    if (!isWeekend && !isHoliday) {
      workingDays++;
    }

    current.setDate(current.getDate() + 1);
  }

  return workingDays;
}

/**
 * Pure client/in-memory helper for previewing working days before server submission
 */
export function previewWorkingDays(
  startDate: Date | string,
  finishDate: Date | string,
  knownHolidayStrings: string[] = []
): number {
  const start = new Date(startDate);
  const finish = new Date(finishDate);
  start.setHours(0, 0, 0, 0);
  finish.setHours(0, 0, 0, 0);

  if (finish < start) return 0;

  const holidaySet = new Set(knownHolidayStrings);
  let workingDays = 0;
  const current = new Date(start);

  while (current <= finish) {
    const dayOfWeek = current.getDay();
    const dateStr = current.toISOString().split("T")[0];

    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = holidaySet.has(dateStr);

    if (!isWeekend && !isHoliday) {
      workingDays++;
    }

    current.setDate(current.getDate() + 1);
  }

  return workingDays;
}
