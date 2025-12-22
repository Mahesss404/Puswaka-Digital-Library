// Penalty Calc (Rp 5,000 / day)
export function calculateFine(data,dueDate,now) {
let penalty = 0;
let daysOverdue = 0;
if (data.status === 'borrowed' && dueDate && now > dueDate) {
    const diffTime = Math.abs(now - dueDate);
    daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    penalty = daysOverdue * 1000;
    }
    return {penalty,daysOverdue};
}


