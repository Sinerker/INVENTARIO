// Variáveis Globais
const telaCheia = document.getElementById("botaoTelaCheia");
const arquivo = 'https://raw.githubusercontent.com/Sinerker/INVENTARIO/refs/heads/main/EANS%20COMBINADOS.txt';
let dadosCsv = [];
const checkboxQtde1 = document.getElementById("checkboxQtde1");
const campoQuantidade = document.getElementById("quantidade");
const campoEAN = document.getElementById("EAN");

// Função para carregar os dados do arquivo CSV (formato TXT)
function carregarDadosCsv(){
    fetch(arquivo)
        .then(response => response.text())
        .then(conteudo => {
            dadosCsv = conteudo.split('\n').map(linha => linha.split(';'));
            console.log(dadosCsv);
        })
        .catch(error => console.error('Erro ao carregar arquivo CSV: ', error));
}

// Evento para o checkbox
checkboxQtde1.addEventListener("change", function() {
    if (checkboxQtde1.checked) {
        campoQuantidade.value = 1;
        campoQuantidade.disabled = true;
        campoEAN.focus();
    } else {
        campoQuantidade.value = "";
        campoQuantidade.disable =false;
        campoEAN.focus();
    }
});

// Função para salvar contagem no IndexedDB
function salvarContagem(usuario, local, ean, descricao, quantidade) {
    if (!db) {
        console.error("Banco de dados não inicializado.");
        return;
    }

    // Remover espaços extras e quebras de linha
    ean = ean.trim();
    descricao = descricao.trim();

    const transaction = db.transaction(["contagens"], "readwrite");
    const store = transaction.objectStore("contagens");

    const registro = {
        usuario: usuario,
        local: local,
        ean: ean,
        descricao: descricao,
        quantidade: quantidade,
        dataHora: new Date().toLocaleString()
    };

    const request = store.add(registro);

    request.onsuccess = function() {
        console.log("Contagem salva com sucesso!");
        exibirMensagemConfirmacao(); // Chama a função para exibir a mensagem
    };

    request.onerror = function(event) {
        console.error("Erro ao salvar contagem: ", event.target.error);
    };
}

// Função para exibir a mensagem de confirmação
function exibirMensagemConfirmacao() {
    const confirmacao = document.getElementById("confirmacao");
    confirmacao.style.display = "block"; // Exibe a mensagem
    setTimeout(() => {
        confirmacao.style.display = "none"; // Oculta após 3 segundos
    }, 1500);
}


// Função para buscar e exibir produto pelo código EAN ou nome
function buscarProduto(codBarras) {
    document.getElementById('detalhesProduto').style.display = "none";
    document.querySelector('.listaProdutosEncontrados').style.display = "none";
    document.getElementById("listaProdutos").innerHTML = '';

    if (codBarras) {
        // Busca produto pelo código de barras
        let produtoEncontrado = dadosCsv.find(linha => linha[2] === codBarras);
        document.getElementById('detalhesProduto').style.display = "block";
        document.getElementById("quantidade").focus();

        if (checkboxQtde1.checked) {
            setTimeout(() => {
                salvarContagem(
                    document.getElementById("usuario").value.trim(),
                    document.getElementById("local").value.trim(),
                    produtoEncontrado[2],
                    produtoEncontrado[1],
                    1
                );
                document.getElementById("EAN").value = "";
                document.getElementById("detalhesProduto").textContent = "Nenhum produto encontrado.";
                document.querySelector('.infoProduto').style.display = "none";
                campoEAN.focus();
            }, 1000);
        }

        

        if (!produtoEncontrado) {
            // Se não encontrar, busca pelo nome
            const palavras = codBarras.split(/\s+/);
            const produtosEncontradosPorNome = dadosCsv.filter(linha => {
                const descricao = linha[1];  // Descrição do produto
                return descricao && palavras.every((palavra, index) => {
                    const posicao = descricao.toLowerCase().indexOf(palavra.toLowerCase());
                    return posicao !== -1 && (index === 0 || descricao.toLowerCase().indexOf(palavra.toLowerCase()) > descricao.toLowerCase().indexOf(palavras[index - 1].toLowerCase()));
                });
            });

            if (produtosEncontradosPorNome.length > 0) {
                // Exibe lista de produtos encontrados por nome
                const listaProdutos = document.getElementById("listaProdutos");
                produtosEncontradosPorNome.forEach(linha => {
                    const li = document.createElement("li");
                    li.innerHTML = `
                        <strong>${linha[0]}</strong> - 
                        <strong>${linha[2]}</strong> - 
                        ${linha[1]} - 
                        <span style="color: black;"><strong>UN ${linha[3]}</strong></span>
                    `;
                    li.addEventListener("click", function() {
                        document.getElementById("detalhesProduto").innerHTML = `
                            <strong>${linha[0]}</strong> - 
                            <strong>${linha[2]}</strong> - 
                            ${linha[1]} - 
                            <span style="color: black;"><strong>UN ${linha[3]}</strong></span>
                        `;
                        document.querySelector('.infoProduto').style.display = "block";
                        document.querySelector('.listaProdutosEncontrados').style.display = "none";
                    });
                    listaProdutos.appendChild(li);
                });

                document.querySelector('.listaProdutosEncontrados').style.display = "block";
            } else {
                document.querySelector('.listaProdutosEncontrados').style.display = "none";
            }
        } else {
            // Exibe produto encontrado pelo código de barras
            const produtoFormatado = `
                <strong>${produtoEncontrado[0]}</strong> - 
                <strong>${produtoEncontrado[2]}</strong> - 
                ${produtoEncontrado[1]} - 
                <span style="color: black;"><strong>UN ${produtoEncontrado[3]}</strong></span>
            `;
            document.getElementById("detalhesProduto").innerHTML = produtoFormatado;
            document.querySelector('.infoProduto').style.display = "block";
        }
    } else {
        document.querySelector('.infoProduto').style.display = "none";
        document.querySelector('.listaProdutosEncontrados').style.display = "none";
    }
}


// Função para verificar se o código de barras já está no IndexedDB e somar as quantidades
function verificarSomaQuantidade(codBarras) {
    if (!db) {
        console.error("Banco de dados não inicializado.");
        return;
    }

    // Remover espaços extras e quebras de linha
    codBarras = codBarras.trim();

    if (checkboxQtde1.checked) {
        return;
    }

    const transaction = db.transaction(["contagens"], "readonly");
    const store = transaction.objectStore("contagens");

    const index = store.index("ean");
    const request = index.getAll(codBarras);  // Usando getAll para pegar todos os registros

    request.onsuccess = function(event) {
        const contagens = event.target.result;
        if (contagens.length > 0) {
            let somaQuantidades = contagens.reduce((total, registro) => total + registro.quantidade, 0);
            document.getElementById("quantidade").value = somaQuantidades;
            document.getElementById("quantidade").focus();
            document.getElementById("quantidade").select();
        } else {
            document.getElementById("quantidade").value = "";
        }
    };

    request.onerror = function(event) {
        console.error("Erro ao buscar registros no IndexedDB: ", event.target.error);
    };
}



// Função para inicializar o banco de dados IndexedDB
let db;
const request = indexedDB.open("ContagemDB", 1);

request.onupgradeneeded = function(event) {
    db = event.target.result;
    const store = db.createObjectStore("contagens", { keyPath: "id", autoIncrement: true });
    store.createIndex("usuario", "usuario", { unique: false });
    store.createIndex("local", "local", { unique: false });
    store.createIndex("ean", "ean", { unique: false });
    store.createIndex("descricao", "descricao", { unique: false });
    store.createIndex("quantidade", "quantidade", { unique: false });
    store.createIndex("dataHora", "dataHora", { unique: false });
};

request.onsuccess = function(event) {
    db = event.target.result;
};

request.onerror = function(event) {
    console.error("Erro ao abrir IndexedDB", event.target.error);
};

// Inicialização ao carregar o conteúdo da página
document.addEventListener('DOMContentLoaded', () => {
    carregarDadosCsv();
});

// Eventos de interação
telaCheia.addEventListener('click', function() {
    const pagina = document.documentElement;
    pagina.requestFullscreen();
    telaCheia.style.display = 'none';
});

document.addEventListener('fullscreenchange', function() {
    if (!document.fullscreenElement) {
        telaCheia.style.display = "block";
    }
});

// Buscar produto pelo EAN ao pressionar Enter
document.getElementById("EAN").addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        const codBarras = document.getElementById("EAN").value.trim();
        buscarProduto(codBarras);
        verificarSomaQuantidade(codBarras); // Função que verifica e soma as quantidades
    }
});

// Evento ao pressionar ENTER no campo de quantidade
document.getElementById("quantidade").addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        const usuario = document.getElementById("usuario").value.trim();
        const local = document.getElementById("local").value.trim();
        const quantidade = parseInt(document.getElementById("quantidade").value.trim(), 10);
        const detalhesProduto = document.getElementById("detalhesProduto").textContent;

        if (!usuario || !local) {
            const infoProduto = document.querySelector('.infoProduto');
            const detalhesProdutoElement = document.getElementById('detalhesProduto');
            detalhesProdutoElement.textContent = "Por favor, preencha o usuário e o local antes de salvar.";
            infoProduto.style.display = "block";
            return;
        }

        if (!detalhesProduto || detalhesProduto === "Nenhum produto encontrado.") {
            const infoProduto = document.querySelector('.infoProduto');
            const detalhesProdutoElement = document.getElementById('detalhesProduto');
            detalhesProdutoElement.textContent = "Nenhum produto selecionado para contar.";
            infoProduto.style.display = "block";
            return;
        }

        const produtoDados = detalhesProduto.split(" - ");
        const ean = produtoDados[1];
        const descricao = produtoDados[2];

        if (quantidade >= 5000) {
            const detalhesProdutoElement = document.getElementById('detalhesProduto');
            detalhesProdutoElement.textContent = "A quantidade não pode ser maior que 5000. Por favor, insira uma quantidade válida.";
            document.getElementById("EAN").select(); // Foca e seleciona o campo de quantidade
            return; // Não continua até que a quantidade seja válida
        }

        if (quantidade === 0) {
            document.getElementById("EAN").value = "";
            document.getElementById("quantidade").value = "";
            document.getElementById("detalhesProduto").textContent = "Nenhum produto encontrado.";
            document.querySelector('.infoProduto').style.display = "none";
            document.querySelector('.listaProdutosEncontrados').style.display = "none";
        } else {
            salvarContagem(usuario, local, ean, descricao, quantidade);
            document.getElementById("EAN").value = "";
            document.getElementById("quantidade").value = "";
            document.getElementById("detalhesProduto").textContent = "Nenhum produto encontrado.";
            document.querySelector('.infoProduto').style.display = "none";
            document.querySelector('.listaProdutosEncontrados').style.display = "none";
        }
        document.getElementById("EAN").focus();
    }
});

// Função para limpar os campos
document.getElementById("btnLimpar").addEventListener("click", function() {
    document.getElementById("EAN").value = "";
    document.getElementById("quantidade").value = "";
    document.getElementById("detalhesProduto").textContent = "Nenhum produto encontrado.";
    document.querySelector('.infoProduto').style.display = "none";
    document.querySelector('.listaProdutosEncontrados').style.display = "none";
    document.getElementById("EAN").focus();
});

// Ajustar o foco para os campos ao pressionar Enter
document.getElementById("usuario").addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        document.getElementById("local").focus();
    }
});

document.getElementById("local").addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        document.getElementById("EAN").focus();
    }
});

// Função de ajuste de rolagem de entrada ao focar no campo
document.querySelectorAll("input").forEach(input => {
    input.addEventListener("focus", function() {
        setTimeout(() => {
            input.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 300);
    });
});






// Função para baixar os dados do IndexedDB
function baixarDadosContagem() {
    if (!db) {
        console.error("Banco de dados não inicializado.");
        return;
    }
    
    const transaction = db.transaction(["contagens"], "readonly");
    const store = transaction.objectStore("contagens");
    const request = store.getAll();

    request.onsuccess = function(event) {
        const contagens = event.target.result;
        if (contagens.length === 0) {
            alert("Não há contagens para baixar.");
            return;
        }
        
        // Converter para CSV
        let csvContent = "usuario;local;ean;descricao;quantidade;dataHora\n";
        contagens.forEach(registro => {
            csvContent += `${registro.usuario};${registro.local};${registro.ean};${registro.descricao};${registro.quantidade};${registro.dataHora}\n`;
        });

        // Criar um blob e baixar o arquivo
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "contagens.csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Perguntar ao usuário se o download foi concluído
        setTimeout(() => {
            const confirmacao = confirm("O arquivo foi baixado corretamente? Se sim, os dados salvos serão apagados.");
            if (confirmacao) {
                limparIndexedDB();
            }
        }, 1000);
    };

    request.onerror = function(event) {
        console.error("Erro ao recuperar dados do IndexedDB: ", event.target.error);
    };
}

// Função para limpar o IndexedDB
function limparIndexedDB() {
    const transaction = db.transaction(["contagens"], "readwrite");
    const store = transaction.objectStore("contagens");
    const request = store.clear();

    request.onsuccess = function() {
        alert("Banco de dados limpo com sucesso!");
    };

    request.onerror = function(event) {
        console.error("Erro ao limpar o IndexedDB: ", event.target.error);
    };
}

// Adicionar evento ao botão Salvar
document.getElementById("btnSalvar").addEventListener("click", baixarDadosContagem);
