
class Mic1{

    constructor(){
        this.registers = {
            PC: 0,  // Program Counter
            AC: 0,  // Accumulator
            SP: 0,  // Stack Pointer
            IR: 0,  // Memory Instruction Register
            TIR: 0, // Temporary Instruction Register
            "0": 0, // Zero
            "+1": 0, // Plus One
            "-1": 0, // Minus One
            AMASK: 0, // Adress Mask
            SMASK: 0, // Stack Mask
            A: 0,    // A Register
            B: 0,    // B Register
            C: 0,    // C Register
            D: 0,    // D Register
            E: 0,    // E Register
            F: 0,    // F Register
            MAR: 0,  // Memory Address Register
            MBR: 0,  // Memory Buffer Register
            AMUX: 0,
            ALU: [0,0], 
            Shifter: 0,
            ALatch: 0,
            BLatch: 0,
            N: 0, // Minus One
            Z: 0, // Minus One
        };

        // Memória
        this.memory = new Array(256).fill(0); 
    }

    ALU(op) {
        switch (op) {
            case 'ADD': return this.registers.ALU[0] + this.registers.ALU[1];
            case 'SUB': return this.registers.ALU[0] - this.registers.ALU[1];
            case 'AND': return this.registers.ALU[0] & this.registers.ALU[1];
            case 'OR': return this.registers.ALU[0] | this.registers.ALU[1];
            default: return 0;
        }
    }

    // Unidade de Controle - Função para executar uma microinstrução
    execMicroInst(microOp) {
        switch (microOp) {
            // case 'MAR <- PC':
            //     this.registers.MAR = this.registers.PC;
            //     break;
            case 'MBR <- M[MAR]':
                this.registers.MBR = this.memory[this.registers.MAR];
                break;
            case 'PC <- PC + 1':
                this.registers.PC += 1;
                break;
            case 'AC <- MBR':
                this.registers.AC = this.registers.MBR;
                break;
            case 'A <- AC':
                this.registers.A = this.registers.AC;
                break;
            case 'AC <- A + MBR':
                this.registers.ALU = [this.registers.A, this.registers.MBR]
                this.registers.AC = this.ALU('ADD');
                break;
            case 'MBR <- AC':
                this.registers.MBR = this.registers.AC;
                break;
            case 'M[MAR] <- MBR':
                this.memory[this.registers.MAR] = this.registers.MBR;
                break;
            case 'PC <- MBR':  
                this.registers.PC = this.registers.MBR;
                break;
            case 'MBR <- M[MAR]':  
                this.registers.MBR = this.memory[this.registers.MAR];
                break;
            case 'AC <- MBR':  
                this.registers.AC = this.registers.MBR;
                break;
            default:
                console.log("Microinstrução não suportada: ", microOp);
                break;
        }
    }

    // Simulador de Instruções de Alto Nível
    execMacroInst(instruction, address) {
        let addressBit = address.toString(2).padStart(12, '0');
        switch (instruction) {
            case 'LODD':
                this.registers.IR = "0000" + addressBit;
                this.registers.MAR = address;     // Etapa 1: Carrega o endereço no MAR
                this.execMicroInst('MBR <- M[MAR]');  // Etapa 2: Lê o valor da memória para MBR
                this.execMicroInst('AC <- MBR');      // Etapa 3: Transfere para o acumulador AC
                break;
            case 'STOD':
                this.registers.IR = "0001" + addressBit;
                this.registers.MAR = address;     // Etapa 1: Carrega o endereço no MAR
                this.execMicroInst('MBR <- AC');      // Etapa 2: Carrega o valor do acumulador para MBR
                this.execMicroInst('M[MAR] <- MBR');     // Etapa 3: Armazena na memória
                break;
            case 'ADDD':
                this.registers.IR = "0010" + addressBit;
                this.registers.MAR = address;     // Etapa 1: Carrega o endereço no MAR
                this.execMicroInst('MBR <- M[MAR]');  // Etapa 2: Lê o valor da memória para MBR
                this.execMicroInst('A <- AC');        // Etapa 3: Armazena o AC em A
                this.execMicroInst('AC <- A + MBR');  // Etapa 4: Soma A e MBR e armazena em AC
                break;
            case 'SUBD':
                this.registers.IR = "0011" + addressBit;
                this.registers.MAR = address;     // Etapa 1: Carrega o endereço no MAR
                this.execMicroInst('MBR <- M[MAR]');  // Etapa 2: Lê o valor da memória para MBR
                this.execMicroInst('AC <- AC - MBR'); // Etapa 3: Subtrai o valor de MBR de AC
                break;
            case 'JPOS': // Jump 
                this.registers.IR = "0100" + addressBit;
                this.registers.MAR = address; // Carrega o endereço no MAR
                this.execMicroInst('MBR <- M[MAR]');  // Lê o valor de memória
                this.execMicroInst('PC <- (AC > 0) ? MBR : PC');  // Se AC > 0, pula para o valor de MBR
                break;
            case 'JZER': // Jump Zero
                this.registers.IR = "0101" + addressBit;
                this.registers.MAR = address; // Carrega o endereço no MAR
                this.execMicroInst('MBR <- M[MAR]');  // Lê o valor de memória
                this.execMicroInst('PC <- (AC === 0) ? MBR : PC');  // Se AC == 0, pula para o valor de MBR
                break;
            case 'JUMP': // Jump
                this.registers.IR = "0110" + addressBit;
                this.registers.MAR = address; // Carrega o endereço no MAR
                this.execMicroInst('MBR <- M[MAR]');  // Lê o valor de memória
                this.execMicroInst('PC <- MBR');  // Pula para o valor de MBR
                break;
            case 'LOCO': // Load Constant
                this.registers.IR = "0111" + addressBit;
                this.registers.MAR = address; // Carrega o endereço no MAR
                this.execMicroInst('MBR <- M[MAR]');  // Lê o valor de memória
                this.execMicroInst('AC <- MBR');  // Carrega o valor constante no AC
                break;
            case 'LODL': // Load Local
                this.registers.IR = "1000" + addressBit;
                this.registers.MAR = address;     // Carrega o endereço no MAR
                this.execMicroInst('MBR <- M[MAR]');  // Lê o valor de memória para MBR
                this.execMicroInst('AC <- MBR');      // Carrega o valor no acumulador
                break;
            case 'STOL': // Store Local
                this.registers.IR = "1001" + addressBit;
                this.registers.MAR = address;     // Carrega o endereço no MAR
                this.execMicroInst('MBR <- AC');      // Transfere o valor do AC para o MBR
                this.execMicroInst('M[MAR] <- MBR');  // Armazena o valor no endereço
                break;
            case 'ADDL': // Add Local
                this.registers.IR = "1010" + addressBit;
                this.registers.MAR = address;     // Carrega o endereço no MAR
                this.execMicroInst('MBR <- M[MAR]');  // Lê o valor de memória para MBR
                this.execMicroInst('AC <- AC + MBR'); // Soma o valor de AC com o valor de MBR
                break;
            case 'SUBL': // Subtract Local
                this.registers.IR = "1011" + addressBit;
                this.registers.MAR = address;     // Carrega o endereço no MAR
                this.execMicroInst('MBR <- M[MAR]');  // Lê o valor de memória para MBR
                this.execMicroInst('AC <- AC - MBR'); // Subtrai o valor de MBR de AC
                break;
            case 'JNEG': // Jump Negative
                this.registers.IR = "1100" + addressBit;
                this.registers.MAR = address;     // Carrega o endereço no MAR
                this.execMicroInst('MBR <- M[MAR]');  // Lê o valor de memória para MBR
                this.execMicroInst('PC <- (AC < 0) ? MBR : PC'); // Se AC < 0, pula para o valor de MBR
                break;
            case 'JNZE': // Jump Not Zero
                this.registers.IR = "1101" + addressBit;
                this.registers.MAR = address;     // Carrega o endereço no MAR
                this.execMicroInst('MBR <- M[MAR]');  // Lê o valor de memória para MBR
                this.execMicroInst('PC <- (AC !== 0) ? MBR : PC'); // Se AC != 0, pula para o valor de MBR
                break;
            case 'CALL': // Call Subroutine
                this.registers.IR = "1110" + addressBit;
                this.registers.MAR = address; // Carrega o endereço no MAR
                this.execMicroInst('MBR <- M[MAR]');  // Lê o valor da memória
                this.execMicroInst('SP <- SP - 1'); // Decrementa o Stack Pointer (SP)
                this.execMicroInst('M[SP] <- PC');  // Armazena o endereço de retorno no stack
                this.execMicroInst('PC <- MBR');  // Pula para a sub-rotina
                break;   
            case 'PSHI': // Push Indirect
                this.registers.IR = "1111".padEnd(16, '0');
                this.execMicroInst('MAR <- SP');  // Carrega o valor do stack pointer no MAR
                this.execMicroInst('MBR <- M[MAR]');  // Lê o valor da memória para o MBR
                this.execMicroInst('M[MAR] <- MBR');  // Armazena o valor no stack
                break;
            case 'POPI': // Pop Indirect
                this.registers.IR = "1111001".padEnd(16, '0');
                this.execMicroInst('MAR <- SP');  // Carrega o valor do stack pointer no MAR
                this.execMicroInst('MBR <- M[MAR]');  // Lê o valor de memória para MBR
                this.execMicroInst('SP <- SP + 1');  // Incrementa o Stack Pointer
                break;
            case 'PUSH': // Push
                this.registers.IR = "111101".padEnd(16, '0');
                this.execMicroInst('SP <- SP - 1');   // Decrementa o Stack Pointer
                this.execMicroInst('M[SP] <- AC');   // Armazena o valor de AC no topo da pilha
                break;
            case 'POP': // Pop
                this.registers.IR = "1111011".padEnd(16, '0');
                this.execMicroInst('MBR <- M[SP]');  // Lê o valor do topo da pilha para MBR
                this.execMicroInst('AC <- MBR');     // Transfere o valor de MBR para o AC
                this.execMicroInst('SP <- SP + 1');   // Incrementa o Stack Pointer
                break;
            case 'RETN': // Return from Subroutine
                this.registers.IR = "11111".padEnd(16, '0');
                this.execMicroInst('MBR <- M[SP]');   // Lê o valor de retorno da pilha para MBR
                this.execMicroInst('PC <- MBR');      // Transfere o valor de MBR para o PC
                this.execMicroInst('SP <- SP + 1');   // Incrementa o Stack Pointer
                break;
            case 'SWAP': // Swap
                this.registers.IR = "1111101".padEnd(16, '0');
                this.execMicroInst('MBR <- AC');      // Transfere o valor de AC para MBR
                this.execMicroInst('AC <- M[SP]');    // Carrega o valor de memória no topo da pilha para AC
                this.execMicroInst('M[SP] <- MBR');   // Armazena o valor de MBR de volta na pilha
                break;
            case 'INSP': // Increment Stack Pointer
                this.registers.IR = "11111100" + address.toString(2).padStart(8, '0');
                this.execMicroInst('SP <- SP + 1');   // Incrementa o Stack Pointer
                break;
            case 'DESP': // Decrement Stack Pointer
                this.registers.IR = "11111110" + address.toString(2).padStart(8, '0');
                this.execMicroInst('SP <- SP - 1');   // Decrementa o Stack Pointer
                break;
            default:
                console.log("Instrução não suportada: ", instruction);
                break;
        }
        this.execMicroInst('PC <- PC + 1'); // Avança o contador de programa
    }
}

class SimulatorGUI {
    constructor(simulator, history) {
        this.simulator = simulator;
        this.history = history;
        this.historyIndex = 0;
        this.createWidgets();
    }

    createWidgets() {
        this.updateRegisters();
        this.updateMemory();
    }

    updateRegisters() {
        const registersDiv = document.getElementById('registers');
        registersDiv.innerHTML = '';
        for (const reg in this.simulator.registers) {
            const span = document.createElement('span');
            span.innerHTML = `<em>${reg}:</em> ${this.simulator.registers[reg]}`;
            registersDiv.appendChild(span);
        }
    }

    updateMemory() {
        const memoryDiv = document.getElementById('memory');
        memoryDiv.innerHTML = '';
        for (let i = 0; i < this.simulator.memory.length; i++) {
            const span = document.createElement('span');
            span.innerHTML = `<em>${i}:</em> ${this.simulator.memory[i].toString(2).padStart(16, '0')} ( ${this.simulator.memory[i]} )`;
            memoryDiv.appendChild(span);
        }
    }

    loadHistory(index = 0){
        let instance = this.history.getInstance(index);
        console.log(instance);
        this.historyIndex = index;
        this.simulator.memory = instance.memory;
        this.simulator.registers = instance.registers;
    }

    navigateHistory(offset = 1){
        try {
            let instance = this.history.getInstance(this.historyIndex + offset);
            this.historyIndex += offset;
            this.simulator.memory = instance.memory;
            this.simulator.registers = instance.registers;
            this.updateMemory();
            this.updateRegisters();
        } catch (error) {
            console.log("Fora do intervalo do histórico!");
        }
    }

    testSimulation() {
        this.simulator.memory[0] = 10;  // Endereço de teste para LOAD e ADD
        this.simulator.memory[1] = 20;  // Outro endereço de teste para operações de 
        let instructions = [
            ['LODD', 0],
            ['ADDD', 1],
            ['STOD', 6],
        ]

        this.simulator.registers.PC = 0;  // Definir contador de programa para o endereço 0
        
        history.clear();

        instructions.forEach((inst)=> {
            history.addInstance(this.simulator.registers, this.simulator.memory);
            this.simulator.execMacroInst(inst[0], inst[1]);
        })
        history.addInstance(this.simulator.registers, this.simulator.memory);
        this.loadHistory(0);

        history.log();
    }
}

const mic2 = new Mic1();
const history = new History();
const gui = new SimulatorGUI(mic2, history);
runBT = document.querySelector("#runBt");
runBT.onclick = () => {
    gui.testSimulation();
    gui.updateRegisters();
    gui.updateMemory();
}
stepBT = document.querySelector("#stepBt");
stepBT.onclick = (e) => {
    gui.navigateHistory(1);
}
backBT = document.querySelector("#backBt");
backBT.onclick = (e) => {
    gui.navigateHistory(-1);
}
