// 1. Rundet die gesamtanzahl der Stunden auf zweistündig (auf oder ab, je nachdem was näher an der Realität ist)
// 2. Rundet die Stunden pro Tag auf zweistündig (auf oder ab, je nachdem was näher an der Realität ist, aber so angepasst, dass in Summe exakt der gerundete Wert aus Schritt 1 herauskommt)
// 3. Rundet die Stunden pro Projekt und Tag auf zweistündig (auf oder ab, je nachdem was näher an der Realität ist, aber so angepasst, dass in Summe exakt der gerundete Wert für den jeweiligen Tag aus Schritt 2 herauskommt)
var csv = "";
var csvLines = csv.split("\n");
var csvContentLines = csvLines.slice(1);
var lineData = csvContentLines.map(function (line) {
    return line.split(",").map(function (cell) { return cell.replace(/"/g, ""); });
});
var existingEntries = lineData.map(function (lineData) {
    var _a = lineData[11]
        .split(":")
        .map(function (time) { return parseInt(time); }), hours = _a[0], minutes = _a[1], seconds = _a[2];
    return {
        project: lineData[3],
        date: lineData[7],
        durationBiHours: hours / 2 + minutes / 120 + seconds / 7200,
    };
});
var totalDurationBiHours = existingEntries.reduce(function (acc, entry) { return acc + entry.durationBiHours; }, 0);
var totalDurationBiHoursRounded = Math.round(totalDurationBiHours);
var existingEntriesByDay = existingEntries.reduce(function (acc, entry) {
    var existingEntriesByDay = acc.get(entry.date) || [];
    existingEntriesByDay.push(entry);
    acc.set(entry.date, existingEntriesByDay);
    return acc;
}, new Map());
var existingProjectDurationsByDay = new Map(Array.from(existingEntriesByDay.entries()).map(function (_a) {
    var date = _a[0], entries = _a[1];
    var projectDurations = entries.reduce(function (acc, entry) {
        var existingProjectDuration = acc.get(entry.project) || 0;
        acc.set(entry.project, existingProjectDuration + entry.durationBiHours);
        return acc;
    }, new Map());
    return [date, projectDurations];
}));
var totalDurationByDay = new Map(Array.from(existingEntriesByDay.entries()).map(function (_a) {
    var date = _a[0], entries = _a[1];
    var totalDuration = entries.reduce(function (acc, entry) { return acc + entry.durationBiHours; }, 0);
    return [date, totalDuration];
}));
var totalDurationByDayRoundedAndDifference = new Map(Array.from(totalDurationByDay.entries()).map(function (_a) {
    var date = _a[0], totalDuration = _a[1];
    return [
        date,
        {
            rounded: Math.round(totalDuration),
            differenceToActual: Math.round(totalDuration) - totalDuration,
        },
    ];
}));
while (true) {
    var totalRounded = Array.from(totalDurationByDayRoundedAndDifference.values()).reduce(function (acc, _a) {
        var rounded = _a.rounded;
        return acc + rounded;
    }, 0);
    if (totalRounded === totalDurationBiHoursRounded) {
        break;
    }
    if (totalRounded > totalDurationBiHoursRounded) {
        var dayWithMaxDifference = Array.from(totalDurationByDayRoundedAndDifference.entries()).reduce(function (acc, _a) {
            var date = _a[0], differenceToActual = _a[1].differenceToActual;
            if (differenceToActual > acc.differenceToActual) {
                return { date: date, differenceToActual: differenceToActual };
            }
            return acc;
        }, { date: "", differenceToActual: -Infinity });
        totalDurationByDayRoundedAndDifference.set(dayWithMaxDifference.date, {
            rounded: totalDurationByDayRoundedAndDifference.get(dayWithMaxDifference.date)
                .rounded - 1,
            differenceToActual: totalDurationByDayRoundedAndDifference.get(dayWithMaxDifference.date)
                .differenceToActual + 1,
        });
    }
    if (totalRounded < totalDurationBiHoursRounded) {
        var dayWithMaxDifference = Array.from(totalDurationByDayRoundedAndDifference.entries()).reduce(function (acc, _a) {
            var date = _a[0], differenceToActual = _a[1].differenceToActual;
            if (differenceToActual < acc.differenceToActual) {
                return { date: date, differenceToActual: differenceToActual };
            }
            return acc;
        }, { date: "", differenceToActual: Infinity });
        totalDurationByDayRoundedAndDifference.set(dayWithMaxDifference.date, {
            rounded: totalDurationByDayRoundedAndDifference.get(dayWithMaxDifference.date)
                .rounded + 1,
            differenceToActual: totalDurationByDayRoundedAndDifference.get(dayWithMaxDifference.date)
                .differenceToActual - 1,
        });
    }
}
var roundedProjectDurationsByDayWithDifference = new Map(existingProjectDurationsByDay.entries().map(function (_a) {
    var date = _a[0], projectDurations = _a[1];
    var roundedProjectDurations = new Map(Array.from(projectDurations.entries()).map(function (_a) {
        var project = _a[0], duration = _a[1];
        return [
            project,
            {
                rounded: Math.round(duration),
                differenceToActual: Math.round(duration) - duration,
            },
        ];
    }));
    return [date, roundedProjectDurations];
}));
roundedProjectDurationsByDayWithDifference
    .entries()
    .forEach(function (_a) {
    var date = _a[0], projectDurations = _a[1];
    while (true) {
        var totalRounded = Array.from(projectDurations.values()).reduce(function (acc, _a) {
            var rounded = _a.rounded;
            return acc + rounded;
        }, 0);
        if (totalRounded ===
            totalDurationByDayRoundedAndDifference.get(date).rounded) {
            break;
        }
        if (totalRounded > totalDurationByDayRoundedAndDifference.get(date).rounded) {
            var projectWithMaxDifference = Array.from(projectDurations.entries()).reduce(function (acc, _a) {
                var project = _a[0], differenceToActual = _a[1].differenceToActual;
                if (differenceToActual > acc.differenceToActual) {
                    return { project: project, differenceToActual: differenceToActual };
                }
                return acc;
            }, { project: "", differenceToActual: -Infinity });
            projectDurations.set(projectWithMaxDifference.project, {
                rounded: projectDurations.get(projectWithMaxDifference.project).rounded - 1,
                differenceToActual: projectDurations.get(projectWithMaxDifference.project)
                    .differenceToActual + 1,
            });
        }
        if (totalRounded < totalDurationByDayRoundedAndDifference.get(date).rounded) {
            var projectWithMaxDifference = Array.from(projectDurations.entries()).reduce(function (acc, _a) {
                var project = _a[0], differenceToActual = _a[1].differenceToActual;
                if (differenceToActual < acc.differenceToActual) {
                    return { project: project, differenceToActual: differenceToActual };
                }
                return acc;
            }, { project: "", differenceToActual: Infinity });
            projectDurations.set(projectWithMaxDifference.project, {
                rounded: projectDurations.get(projectWithMaxDifference.project).rounded + 1,
                differenceToActual: projectDurations.get(projectWithMaxDifference.project)
                    .differenceToActual - 1,
            });
        }
    }
});
var output = Array.from(roundedProjectDurationsByDayWithDifference.entries())
    .sort(function (_a, _b) {
    var dateA = _a[0];
    var dateB = _b[0];
    var ymdA = dateA.split("-").map(function (part) { return parseInt(part); });
    var ymdB = dateB.split("-").map(function (part) { return parseInt(part); });
    return ymdA[0] - ymdB[0] || ymdA[1] - ymdB[1] || ymdA[2] - ymdB[2];
})
    .flatMap(function (_a) {
    var date = _a[0], projectDurations = _a[1];
    return Array.from(projectDurations.entries()).map(function (_a) {
        var project = _a[0], rounded = _a[1].rounded;
        return ({ date: date, project: project, rounded: rounded });
    });
})
    .map(function (_a) {
    var date = _a.date, project = _a.project, rounded = _a.rounded;
    var ymd = date.split("-");
    return "\"".concat(ymd.reverse().join("/"), "\",\"yes\",\"").concat(project, "\",\"").concat(rounded * 2, "\"");
})
    .join("\n");
console.log(totalDurationByDay);
console.log(totalDurationByDayRoundedAndDifference);
console.log(roundedProjectDurationsByDayWithDifference);
console.log(output);
