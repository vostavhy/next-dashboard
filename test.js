function persistence(num) {
  let result = 0;
  let newNum = num;

  while (1) {
    if (Math.trunc(newNum / 10) === 0) {
      break;
    }
    const arrNumbers = String(newNum).split('');
    newNum = arrNumbers.reduce((cum, num) => cum * Number(num), 1);
    result += 1;
  }

  return result;
}

console.log(persistence(4)); // 3
