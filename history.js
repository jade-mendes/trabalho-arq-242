class History {
    constructor() {
        this.instances = []; // Array para armazenar múltiplas instâncias de CPU
    }

    // Método para adicionar uma nova instância
    addInstance(registers, memory) {
        const registersCopy = JSON.parse(JSON.stringify(registers)); // Cópia profunda dos registers
        const memoryCopy = [...memory]; // Cópia rasa do array memory
        this.instances.push({ registers: registersCopy, memory: memoryCopy });
    }

    // Método para obter uma instância específica
    getInstance(index) {
        return this.instances[index];
    }

    log(){
        console.log(this.instances);
    }

    clear(){
        this.instances = []
    }
}