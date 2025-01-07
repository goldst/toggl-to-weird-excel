// 1. Rundet die gesamtanzahl der Stunden auf zweistündig (auf oder ab, je nachdem was näher an der Realität ist)
// 2. Rundet die Stunden pro Tag auf zweistündig (auf oder ab, je nachdem was näher an der Realität ist, aber so angepasst, dass in Summe exakt der gerundete Wert aus Schritt 1 herauskommt)
// 3. Rundet die Stunden pro Projekt und Tag auf zweistündig (auf oder ab, je nachdem was näher an der Realität ist, aber so angepasst, dass in Summe exakt der gerundete Wert für den jeweiligen Tag aus Schritt 2 herauskommt)

const csv = ``;

const csvLines = csv.split("\n");
const csvContentLines = csvLines.slice(1);

const lineData = csvContentLines.map((line) =>
  line.split(",").map((cell) => cell.replace(/"/g, ""))
);

type TimeEntry = {
  project: string;
  date: string;
  durationBiHours: number;
};

const existingEntries = lineData.map((lineData) => {
  const [hours, minutes, seconds] = lineData[11]
    .split(":")
    .map((time) => parseInt(time));

  return {
    project: lineData[3],
    date: lineData[7],
    durationBiHours: hours / 2 + minutes / 120 + seconds / 7200,
  } satisfies TimeEntry;
});

const totalDurationBiHours = existingEntries.reduce(
  (acc, entry) => acc + entry.durationBiHours,
  0
);

const totalDurationBiHoursRounded = Math.round(totalDurationBiHours);

const existingEntriesByDay = existingEntries.reduce((acc, entry) => {
  const existingEntriesByDay = acc.get(entry.date) || [];
  existingEntriesByDay.push(entry);
  acc.set(entry.date, existingEntriesByDay);
  return acc;
}, new Map<string, TimeEntry[]>());

const existingProjectDurationsByDay = new Map(
  Array.from(existingEntriesByDay.entries()).map(([date, entries]) => {
    const projectDurations = entries.reduce((acc, entry) => {
      const existingProjectDuration = acc.get(entry.project) || 0;
      acc.set(entry.project, existingProjectDuration + entry.durationBiHours);
      return acc;
    }, new Map<string, number>());
    return [date, projectDurations];
  })
);

const totalDurationByDay = new Map(
  Array.from(existingEntriesByDay.entries()).map(([date, entries]) => {
    const totalDuration = entries.reduce(
      (acc, entry) => acc + entry.durationBiHours,
      0
    );
    return [date, totalDuration];
  })
);

const totalDurationByDayRoundedAndDifference = new Map(
  Array.from(totalDurationByDay.entries()).map(([date, totalDuration]) => {
    return [
      date,
      {
        rounded: Math.round(totalDuration),
        differenceToActual: Math.round(totalDuration) - totalDuration,
      },
    ];
  })
);

while (true) {
  const totalRounded = Array.from(
    totalDurationByDayRoundedAndDifference.values()
  ).reduce((acc, { rounded }) => acc + rounded, 0);

  if (totalRounded === totalDurationBiHoursRounded) {
    break;
  }

  if (totalRounded > totalDurationBiHoursRounded) {
    const dayWithMaxDifference = Array.from(
      totalDurationByDayRoundedAndDifference.entries()
    ).reduce(
      (acc, [date, { differenceToActual }]) => {
        if (differenceToActual > acc.differenceToActual) {
          return { date, differenceToActual };
        }
        return acc;
      },
      { date: "", differenceToActual: -Infinity }
    );

    totalDurationByDayRoundedAndDifference.set(dayWithMaxDifference.date, {
      rounded:
        totalDurationByDayRoundedAndDifference.get(dayWithMaxDifference.date)!
          .rounded - 1,
      differenceToActual:
        totalDurationByDayRoundedAndDifference.get(dayWithMaxDifference.date)!
          .differenceToActual + 1,
    });
  }

  if (totalRounded < totalDurationBiHoursRounded) {
    const dayWithMaxDifference = Array.from(
      totalDurationByDayRoundedAndDifference.entries()
    ).reduce(
      (acc, [date, { differenceToActual }]) => {
        if (differenceToActual < acc.differenceToActual) {
          return { date, differenceToActual };
        }
        return acc;
      },
      { date: "", differenceToActual: Infinity }
    );

    totalDurationByDayRoundedAndDifference.set(dayWithMaxDifference.date, {
      rounded:
        totalDurationByDayRoundedAndDifference.get(dayWithMaxDifference.date)!
          .rounded + 1,
      differenceToActual:
        totalDurationByDayRoundedAndDifference.get(dayWithMaxDifference.date)!
          .differenceToActual - 1,
    });
  }
}

const roundedProjectDurationsByDayWithDifference = new Map(
  existingProjectDurationsByDay.entries().map(([date, projectDurations]) => {
    const roundedProjectDurations = new Map(
      Array.from(projectDurations.entries()).map(([project, duration]) => {
        return [
          project,
          {
            rounded: Math.round(duration),
            differenceToActual: Math.round(duration) - duration,
          },
        ];
      })
    );
    return [date, roundedProjectDurations];
  })
);

roundedProjectDurationsByDayWithDifference
  .entries()
  .forEach(([date, projectDurations]) => {
    while (true) {
      const totalRounded = Array.from(projectDurations.values()).reduce(
        (acc, { rounded }) => acc + rounded,
        0
      );

      if (
        totalRounded ===
        totalDurationByDayRoundedAndDifference.get(date)!.rounded
      ) {
        break;
      }

      if (
        totalRounded > totalDurationByDayRoundedAndDifference.get(date)!.rounded
      ) {
        const projectWithMaxDifference = Array.from(
          projectDurations.entries()
        ).reduce(
          (acc, [project, { differenceToActual }]) => {
            if (differenceToActual > acc.differenceToActual) {
              return { project, differenceToActual };
            }
            return acc;
          },
          { project: "", differenceToActual: -Infinity }
        );

        projectDurations.set(projectWithMaxDifference.project, {
          rounded:
            projectDurations.get(projectWithMaxDifference.project)!.rounded - 1,
          differenceToActual:
            projectDurations.get(projectWithMaxDifference.project)!
              .differenceToActual + 1,
        });
      }

      if (
        totalRounded < totalDurationByDayRoundedAndDifference.get(date)!.rounded
      ) {
        const projectWithMaxDifference = Array.from(
          projectDurations.entries()
        ).reduce(
          (acc, [project, { differenceToActual }]) => {
            if (differenceToActual < acc.differenceToActual) {
              return { project, differenceToActual };
            }
            return acc;
          },
          { project: "", differenceToActual: Infinity }
        );

        projectDurations.set(projectWithMaxDifference.project, {
          rounded:
            projectDurations.get(projectWithMaxDifference.project)!.rounded + 1,
          differenceToActual:
            projectDurations.get(projectWithMaxDifference.project)!
              .differenceToActual - 1,
        });
      }
    }
  });

const output = Array.from(roundedProjectDurationsByDayWithDifference.entries())
  .sort(([dateA], [dateB]) => {
    const ymdA = dateA.split("-").map((part) => parseInt(part));
    const ymdB = dateB.split("-").map((part) => parseInt(part));
    
    return ymdA[0] - ymdB[0] || ymdA[1] - ymdB[1] || ymdA[2] - ymdB[2];
  })
  .flatMap(([date, projectDurations]) => {
    return Array.from(projectDurations.entries()).map(
      ([project, { rounded }]) => ({ date, project, rounded })
    );
  })
  .map(({ date, project, rounded }) => {
    const ymd = date.split("-");
    return `"${ymd.reverse().join("/")}","yes","${project}","${rounded * 2}"`
  })
  .join("\n");

console.log(totalDurationByDay);
console.log(totalDurationByDayRoundedAndDifference);
console.log(roundedProjectDurationsByDayWithDifference);
console.log(output);
