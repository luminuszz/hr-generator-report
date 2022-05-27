type Args = {
  date: string;
  startTime: string;
  endTime: string;
  interval: number;
  description: string;
};

export default ({ startTime, endTime, date, interval, description }: Args) =>
  `
    Dia: ${date}
    Entrada: ${startTime}
    Saída: ${endTime}
    Total de horas: ${interval}
    Motivo: ${description}  
    
  `;
