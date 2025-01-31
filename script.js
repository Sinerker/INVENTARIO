const botao = document.getElementById('botaoTelaCheia');

botao.addEventListener('click', function () {
    const elemento = document.documentElement;
    if (elemento.requestFullscreen) {
        elemento.requestFullscreen();
    } else if (elemento.webkitRequestFullscreen) {
        elemento.webkitRequestFullscreen();
    } else if (elemento.mozRequestFullScreen) {
        elemento.mozRequestFullScreen();
    } else if (elemento.msRequestFullscreen) {
        elemento.msRequestFullscreen();
    }
    botao.style.display = 'none';
});

document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
        botao.style.display = 'block';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('usuario').focus();
    carregarDadosCsv();
});

let dadosCsv = [];
let inventario = [];
let quantidadesPorProduto = {};
const arquivoCsvUrl = 'https://raw.githubusercontent.com/Sinerker/INVENTARIO/main/dados.csv';

function carregarDadosCsv() {
    fetch(arquivoCsvUrl)
        .then(response => response.text())
        .then(conteudo => {
            dadosCsv = conteudo.split('\n').map(linha => linha.split(';'));
            document.getElementById('mensagemUpload').style.display = 'block';
            document.getElementById('titulo').style.display = 'none';
        })
        .catch(error => console.error('Erro ao carregar o arquivo CSV:', error));
}






function exibirListaDeProdutos(produtos) {
    const listaProdutos = document.getElementById('listaProdutos');
    listaProdutos.innerHTML = '';

    if (produtos.length === 0) {
        document.getElementById('listaProdutosEncontrados').style.display = 'none';
        document.getElementById('detalhesProduto').textContent = 'Nenhum produto encontrado.';
        return;
    }

    produtos.forEach(produto => {
        const itemLista = document.createElement('li');

        // Montando a string com mais informações do produto
        const codigo = produto[0] ? produto[0].trim() : 'Sem código';
        const descricao = produto[1] ? produto[1].trim() : 'Sem descrição';
        const embalagem = produto[2] ? produto[2].trim() : 'Sem embalagem';
        const codigoBarras = produto[3] ? produto[3].trim() : 'Sem código de barras';

        itemLista.innerHTML = `<strong>${codigo}</strong> - ${descricao} | ${embalagem} | <em>${codigoBarras}</em>`;
        
        // Evento de clique para selecionar o produto e exibir os detalhes completos
        itemLista.addEventListener('click', () => mostrarDetalhesDoProduto(produto));
        
        listaProdutos.appendChild(itemLista);
    });

    document.getElementById('listaProdutosEncontrados').style.display = 'block';
}









function mostrarDetalhesDoProduto(produto) {
    document.getElementById('detalhesProduto').textContent = produto.join(' | ');
    document.getElementById('infoProduto').style.display = 'block';
    document.getElementById('quantidade').focus();

    // Obter o código do produto (código de barras)
    const produtoChave = produto[3].trim();

    // Exibe a quantidade total registrada anteriormente
    const totalQuantidades = quantidadesPorProduto[produtoChave] || 0;
    document.getElementById('quantidade').value = totalQuantidades;
    const campoQuantidade = document.getElementById('quantidade');
    campoQuantidade.select();

    // Esconde a lista de produtos encontrados após selecionar um item
    document.getElementById('listaProdutosEncontrados').style.display = 'none';
}



// Procurar o código ou nome do produto e exibir as informações quando "Enter" for pressionado
document.getElementById('codigoBarras').addEventListener('keydown', function (evento) {
    if (evento.keyCode === 13) {  // Se "Enter" for pressionado
        document.getElementById('mensagemConfirmacao').style.display = 'none';
        const pesquisa = this.value.trim();

        if (!pesquisa) {
            document.getElementById('infoProduto').style.display = 'none';
            return;
        }

        let produtoEncontrado = null;

        // Tentar buscar pelo código de barras
        produtoEncontrado = dadosCsv.find(linha => linha[3] && linha[3].trim() === pesquisa);

        if (produtoEncontrado) {
            quantidade.scrollIntoView({ behavior: 'smooth', block: 'start' }); // Rolagem suave
            // Se o produto for encontrado pelo código, exibe os detalhes
            mostrarDetalhesDoProduto(produtoEncontrado);
        } else {
            if (isNaN(produtoEncontrado)) {
                // Se não for um número válido (não encontrar pelo código), buscar pelo nome
                const nomeProdutosEncontrados = dadosCsv.filter(linha => {
                    if (!linha[1]) return false; // Se o nome do produto não existir, ignora.

                    const nomeProduto = linha[1].trim().toLowerCase(); // Nome do produto no CSV.
                    const palavrasPesquisa = pesquisa.toLowerCase().split(/\s+/).filter(palavra => isNaN(palavra) && palavra.trim() !== ""); // Palavras da pesquisa.

                    // Verifica se todas as palavras de pesquisa estão presentes no nome do produto.
                    // Se palavras de pesquisa estiverem vazias, não realiza a busca.
                    if (palavrasPesquisa.length === 0) return false;

                    return palavrasPesquisa.every(palavra => nomeProduto.includes(palavra));
                });

                if (nomeProdutosEncontrados.length > 0) {
                    exibirListaDeProdutos(nomeProdutosEncontrados);
                } else {
                    // Se não encontrar pelo nome ou código
                    document.getElementById('infoProduto').style.display = 'none';
                }
            }
        }
    }
});


document.getElementById('quantidade').addEventListener('keydown', function (evento) {
    if (evento.keyCode === 13) {
        const local = document.getElementById('local').value.trim();
        let quantidade = parseFloat(this.value.trim());
        if (isNaN(quantidade)) {
            alert('Por favor, insira uma quantidade válida.');
            return;
        }
        const produtoDetalhes = document.getElementById('detalhesProduto').textContent.trim();
        const usuario = document.getElementById('usuario').value.trim();
        if (!local || produtoDetalhes === 'Nenhum produto encontrado.') {
            alert('Por favor, preencha todos os campos corretamente.');
            return;
        }

        // Obter o código do produto (código de barras)
        const codigoProduto = produtoDetalhes.split(" | ")[3].trim();

        // Atualizar a quantidade total do produto
        if (!quantidadesPorProduto[codigoProduto]) {
            quantidadesPorProduto[codigoProduto] = 0;
        }
        quantidadesPorProduto[codigoProduto] += quantidade;

        // Salvar no IndexedDB
        inventario.push(`${usuario};${produtoDetalhes};${local};${quantidade}`);
        
        // Aqui você chama a função para salvar o produto diretamente no IndexedDB
        salvarProdutoNoDB({
            codigo: codigoProduto,
            nome: produtoDetalhes.split(" | ")[1].trim(),
            quantidade: quantidadesPorProduto[codigoProduto]
        });

        document.getElementById('mensagemConfirmacao').style.display = 'block';
        document.getElementById('quantidade').value = '';
        document.getElementById('codigoBarras').value = '';
        document.getElementById('detalhesProduto').textContent = 'Nenhum produto encontrado.';
        document.getElementById('infoProduto').style.display = 'none';
        document.getElementById('codigoBarras').focus();
    }
});



document.getElementById('botaoSalvarFinal').addEventListener('click', function () {
    // Antes de salvar, carregar os dados do IndexedDB para o inventário
    carregarProdutosDoDB().then((produtos) => {
        // Atualiza o inventário com os dados do IndexedDB
        inventario = produtos.map(produto => {
            return `${produto.codigo};${produto.nome};${produto.local || ''};${produto.quantidade}`;
        });

        // Verificar se há dados no inventário
        if (inventario.length === 0) {
            alert('Nenhum dado de inventário foi registrado.');
            return;
        }

        const confirmacao = confirm('Você tem certeza que deseja salvar o inventário?');
        if (confirmacao) {
            const cabecalho = ['Usuario', 'Produto', 'Local', 'Quantidade'];
            let conteudoCsv = cabecalho.join(';') + '\n' + inventario.join('\n');
            const blob = new Blob([conteudoCsv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'inventario.csv';
            link.click();
            alert('Inventário salvo com sucesso!');

            // Limpar o inventário após o download
            inventario = [];
        }
    }).catch(error => {
        console.error('Erro ao carregar produtos do DB:', error);
    });
});


document.getElementById('usuario').addEventListener('keydown', event => {
    if (event.key === 'Enter') {
        event.preventDefault();
        document.getElementById('local').focus();
    }
});

document.getElementById('local').addEventListener('keydown', event => {
    if (event.key === 'Enter') {
        event.preventDefault();
        document.getElementById('codigoBarras').focus();
    }
});


document.getElementById('botaoLimpar').addEventListener('click', function () {
    limparCampos();
});

function limparCampos() {
    document.getElementById('codigoBarras').value = '';
    document.getElementById('quantidade').value = '';
    document.getElementById('detalhesProduto').textContent = 'Nenhum produto encontrado.';
    document.getElementById('infoProduto').style.display = 'none';
    document.getElementById('codigoBarras').focus();
}







// ---------------------------------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------------------------------





const DB_NAME = 'InventarioDB';
const DB_VERSION = 1;
const STORE_NAME = 'inventario';

let db;

// Abrir ou criar o banco de dados IndexedDB
function abrirBanco() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onupgradeneeded = function (event) {
            let db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'codigo' });
            }
        };

        request.onsuccess = function (event) {
            db = event.target.result;
            resolve();
        };

        request.onerror = function (event) {
            reject('Erro ao abrir IndexedDB: ' + event.target.errorCode);
        };
    });
}

// Salvar um produto no IndexedDB
function salvarProdutoNoDB(produto) {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    // Tentando salvar o produto no banco
    const request = store.put(produto);

    request.onsuccess = function () {
        console.log('Produto salvo com sucesso:', produto);
    };

    request.onerror = function () {
        console.error('Erro ao salvar o produto no IndexedDB:', request.error);
    };

    transaction.oncomplete = function () {
        console.log('Transação de salvar produto concluída com sucesso!');
    };

    transaction.onerror = function () {
        console.error('Erro na transação ao salvar o produto');
    };
}

// Carregar produtos do IndexedDB ao iniciar a página
function carregarProdutosDoDB() {
    return new Promise((resolve) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = function () {
            resolve(request.result);
        };
    });
}

// Limpar o banco de dados (quando o inventário for salvo)
function limparBancoDeDados() {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.clear();
}

// Evento para salvar um produto
function salvarProduto(codigo, nome, quantidade) {
    const produto = { codigo, nome, quantidade };
    salvarProdutoNoDB(produto);
}

// Ao carregar a página, abrir o banco e recuperar os dados
abrirBanco().then(() => {
    carregarProdutosDoDB().then((produtos) => {
        produtos.forEach(produto => {
            console.log('Produto restaurado:', produto);
            quantidadesPorProduto[produto.codigo] = produto.quantidade;  // Atualiza a quantidade no objeto
        });
    }).catch(error => {
        console.error('Erro ao carregar produtos do DB:', error);
    });
});



// Evento de salvar inventário final
const botaoSalvarFinal = document.getElementById('botaoSalvarFinal');
botaoSalvarFinal.addEventListener('click', function () {
    limparBancoDeDados();
    alert('Inventário final salvo e banco de dados limpo!');
});















