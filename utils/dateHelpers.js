/**
 * Determines the current budget month cycle based on salary credit date.
 *
 * Logic:
 * - If today >= salaryCreditDate → current month cycle = this calendar month
 * - If today < salaryCreditDate → current month cycle = previous calendar month
 *
 * Example (salaryCreditDate = 3):
 * - Feb 1st → belongs to January cycle (salary hasn't arrived yet)
 * - Feb 3rd → belongs to February cycle (salary arrived today)
 * - Feb 15th → belongs to February cycle
 *
 * @param {number} salaryCreditDate - Day of month when salary is credited (1-31)
 * @returns {{ month: number, year: number }}
 */
const getCurrentMonthCycle = (salaryCreditDate) => {
  const today = new Date();
  const currentDay = today.getDate();
  let month = today.getMonth() + 1; // getMonth() is 0-based
  let year = today.getFullYear();

  if (currentDay < salaryCreditDate) {
    // Salary hasn't arrived yet — belongs to previous month's cycle
    month = month - 1;
    if (month === 0) {
      // January edge case → go to December of previous year
      month = 12;
      year = year - 1;
    }
  }

  return { month, year };
};

module.exports = { getCurrentMonthCycle };
