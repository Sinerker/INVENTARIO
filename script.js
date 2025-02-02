// Obtém o elemento HTML do botão de tela cheia
const botao = document.getElementById('botaoTelaCheia');

// Adiciona um ouvinte de evento no botão para ativar a tela cheia
botao.addEventListener('click', function () {
    // Obtém o elemento raiz (documento inteiro) para fazer a tela cheia
    const elemento = document.documentElement;

    // Tenta ativar o modo tela cheia, considerando diferentes navegadores
    if (elemento.requestFullscreen) {
        elemento.requestFullscreen();
    } else if (elemento.webkitRequestFullscreen) {
        elemento.webkitRequestFullscreen();
    } else if (elemento.mozRequestFullScreen) {
        elemento.mozRequestFullScreen();
    } else if (elemento.msRequestFullscreen) {
        elemento.msRequestFullscreen();
    }

    // Esconde o botão de tela cheia depois de ativá-la
    botao.style.display = 'none';
});

// Evento que é disparado quando a tela cheia é desativada
document.addEventListener('fullscreenchange', () => {
    // Se a tela cheia for desativada, exibe o botão novamente
    if (!document.fullscreenElement) {
        botao.style.display = 'block';
    }
});

// Quando o DOM da página é totalmente carregado
document.addEventListener('DOMContentLoaded', () => {
    // Foca no campo do usuário para facilitar a navegação
    document.getElementById('usuario').focus();
    // Carrega os dados do arquivo CSV
    carregarDadosCsv();
    iniciarIndexedDB(); // Inicializa o IndexedDB
});

// Inicializa variáveis globais para armazenar dados
let dadosCsv = [];
let db; // Banco de dados IndexedDB
let quantidadesPorProduto = {};

// URL do arquivo CSV
const arquivoCsvUrl = 'https://raw.githubusercontent.com/Sinerker/INVENTARIO/main/dados.csv';

// Função para carregar os dados do arquivo CSV
function carregarDadosCsv() {
    // Faz uma requisição para pegar o arquivo CSV
    fetch(arquivoCsvUrl)
        .then(response => response.text())  // Obtém o texto do arquivo CSV
        .then(conteudo => {
            // Separa o conteúdo do CSV em linhas e colunas
            dadosCsv = conteudo.split('\n').map(linha => linha.split(';'));
        })
        .catch(error => console.error('Erro ao carregar o arquivo CSV:', error));  // Caso haja erro
}


// Inicializa o banco de dados IndexedDB
// Inicializa o banco de dados IndexedDB
function iniciarIndexedDB() {
    const request = indexedDB.open('InventarioDB', 1); // Aumente a versão para forçar a atualização

    request.onupgradeneeded = function (event) {
        let db = event.target.result;

        // Verifica se a object store já existe antes de tentar criá-la
        if (!db.objectStoreNames.contains('inventario')) {
            db.createObjectStore('inventario', { keyPath: 'id', autoIncrement: true });
            console.log("Object store 'inventario' criada com sucesso!");
        }
    };

    request.onsuccess = function (event) {
        db = event.target.result;
        console.log("IndexedDB aberto com sucesso!");
        carregarDadosDoIndexedDB();
    };

    request.onerror = function (event) {
        console.error('Erro ao abrir IndexedDB:', event.target.errorCode);
    };
}

function limparIndexedDB() {
    if (!db) {
        console.error("Banco de dados não inicializado.");
        return;
    }

    const transacao = db.transaction(['inventario'], 'readwrite');
    const store = transacao.objectStore('inventario');
    const request = store.clear();

    request.onsuccess = function () {
        console.log("IndexedDB limpo com sucesso!");
        alert("Dados apagados! A página será recarregada.");
        location.reload(); // 🔄 Recarrega a página automaticamente
    };

    request.onerror = function (event) {
        console.error("Erro ao limpar IndexedDB:", event.target.error);
    };
}




// Função para salvar os dados no IndexedDB
function salvarNoIndexedDB(usuario, produto, local, quantidade) {
    if (!db) {
        console.error("IndexedDB ainda não está pronto.");
        return;
    }

    const transacao = db.transaction(['inventario'], 'readwrite');
    const store = transacao.objectStore('inventario');

    const objeto = { usuario, produto, local, quantidade };

    const request = store.add(objeto);

    request.onsuccess = function () {
        console.log("Item salvo com sucesso no IndexedDB!");
    };

    request.onerror = function (event) {
        console.error("Erro ao salvar no IndexedDB:", event.target.error);
    };
}

function carregarDadosDoIndexedDB() {
    if (!db) {
        console.error("Banco de dados não está pronto.");
        return;
    }

    const transacao = db.transaction(['inventario'], 'readonly');
    const store = transacao.objectStore('inventario');
    const request = store.getAll();

    request.onsuccess = function () {
        const dados = request.result;
        
        // Se não houver dados, não faz nada
        if (dados.length === 0) return;
        
        console.log("Dados carregados do IndexedDB:", dados);

        // Reinicia o objeto de quantidades
        quantidadesPorProduto = {};

        // Atualiza quantidades com base nos dados armazenados
        dados.forEach(item => {
            const codigoProduto = item.produto.split(' | ')[3].trim(); // Obtém o código de barras
            quantidadesPorProduto[codigoProduto] = (quantidadesPorProduto[codigoProduto] || 0) + parseFloat(item.quantidade);
        });

        console.log("Quantidades restauradas:", quantidadesPorProduto);
    };

    request.onerror = function (event) {
        console.error("Erro ao carregar dados do IndexedDB:", event.target.error);
    };
}



// Função para exibir a lista de produtos encontrados
function exibirListaDeProdutos(produtos) {
    const listaProdutos = document.getElementById('listaProdutos');
    listaProdutos.innerHTML = '';  // Limpa a lista existente

    // Se não houver produtos, exibe mensagem de "nenhum produto encontrado"
    if (produtos.length === 0) {
        document.getElementById('listaProdutosEncontrados').style.display = 'none';
        document.getElementById('detalhesProduto').textContent = 'Nenhum produto encontrado.';
        return;
    }

    // Para cada produto encontrado, cria um item na lista
    produtos.forEach(produto => {
        const itemLista = document.createElement('li');

        // Monta a string com as informações do produto
        const codigo = produto[0] ? produto[0].trim() : 'Sem código';
        const descricao = produto[1] ? produto[1].trim() : 'Sem descrição';
        const embalagem = produto[2] ? produto[2].trim() : 'Sem embalagem';
        const codigoBarras = produto[3] ? produto[3].trim() : 'Sem código de barras';

        // Preenche o item da lista
        itemLista.innerHTML = `<strong>${codigo}</strong> - ${descricao} | ${embalagem} | <b>${codigoBarras}</b>`;
        
        // Evento de clique para exibir os detalhes completos do produto
        itemLista.addEventListener('click', () => mostrarDetalhesDoProduto(produto));
        
        listaProdutos.appendChild(itemLista);
    });

    // Exibe a lista de produtos encontrados
    document.getElementById('listaProdutosEncontrados').style.display = 'block';
}

// Função para exibir os detalhes de um produto quando clicado
function mostrarDetalhesDoProduto(produto) {
    // Exibe as informações do produto selecionado
    document.getElementById('detalhesProduto').textContent = produto.join(' | ');
    document.getElementById('infoProduto').style.display = 'block';
    document.getElementById('quantidade').focus();  // Foca no campo quantidade

    // Obtém o código de barras do produto
    const produtoChave = produto[3].trim();

    // Exibe a quantidade total registrada do produto
    const totalQuantidades = quantidadesPorProduto[produtoChave] || 0;
    document.getElementById('quantidade').value = totalQuantidades;

    // Seleciona o campo da quantidade
    const campoQuantidade = document.getElementById('quantidade');
    campoQuantidade.select();

    // Esconde a lista de produtos encontrados
    document.getElementById('listaProdutosEncontrados').style.display = 'none';
}

// Evento para buscar produto quando o "Enter" é pressionado no campo código de barras
document.getElementById('codigoBarras').addEventListener('keydown', function (evento) {
    if (evento.keyCode === 13) {  // Se "Enter" for pressionado
        document.getElementById('mensagemConfirmacao').style.display = 'none';  // Esconde a mensagem de confirmação
        const pesquisa = this.value.trim();  // Obtém o valor de pesquisa

        // Se o campo de pesquisa estiver vazio, esconde os detalhes
        if (!pesquisa) {
            document.getElementById('infoProduto').style.display = 'none';
            return;
        }

        let produtoEncontrado = null;

        // Tenta buscar pelo código de barras
        produtoEncontrado = dadosCsv.find(linha => linha[3] && linha[3].trim() === pesquisa);

        if (produtoEncontrado) {
            quantidade.scrollIntoView({ behavior: 'smooth', block: 'start' });  // Rolagem suave para o campo quantidade
            // Se o produto for encontrado, exibe os detalhes
            mostrarDetalhesDoProduto(produtoEncontrado);
        } else {
            // Se não encontrar pelo código, tenta buscar pelo nome
            if (isNaN(produtoEncontrado)) {
                // Filtra produtos com base no nome
                const nomeProdutosEncontrados = dadosCsv.filter(linha => {
                    if (!linha[1]) return false;  // Se não houver nome, ignora

                    const nomeProduto = linha[1].trim().toLowerCase();  // Nome do produto
                    const palavrasPesquisa = pesquisa.toLowerCase().split(/\s+/).filter(palavra => isNaN(palavra) && palavra.trim() !== "");  // Palavras da pesquisa

                    // Verifica se todas as palavras de pesquisa estão presentes no nome do produto
                    if (palavrasPesquisa.length === 0) return false;

                    return palavrasPesquisa.every(palavra => nomeProduto.includes(palavra));
                });

                // Se produtos forem encontrados pelo nome, exibe-os
                if (nomeProdutosEncontrados.length > 0) {
                    exibirListaDeProdutos(nomeProdutosEncontrados);
                } else {
                    // Se não encontrar pelo nome nem código
                    document.getElementById('infoProduto').style.display = 'none';
                }
            }
        }
    }
});


// Evento para capturar a quantidade ao pressionar "Enter"
document.getElementById('quantidade').addEventListener('keydown', function (evento) {
    if (evento.keyCode === 13) {
        const local = document.getElementById('local').value.trim();
        let quantidade = parseFloat(this.value.trim());
        if (isNaN(quantidade)) {
            alert('Insira uma quantidade válida.');
            return;
        }
        const produtoDetalhes = document.getElementById('detalhesProduto').textContent.trim();
        const usuario = document.getElementById('usuario').value.trim();
        if (!local || produtoDetalhes === 'Nenhum produto encontrado.') {
            alert('Preencha todos os campos corretamente.');
            return;
        }

        const codigoProduto = produtoDetalhes.split(' | ')[3].trim();
        quantidadesPorProduto[codigoProduto] = (quantidadesPorProduto[codigoProduto] || 0) + quantidade;
        salvarNoIndexedDB(usuario, produtoDetalhes, local, quantidade);

        document.getElementById('mensagemConfirmacao').style.display = 'block';
        document.getElementById('quantidade').value = '';
        document.getElementById('codigoBarras').value = '';
        document.getElementById('detalhesProduto').textContent = 'Nenhum produto encontrado.';
        document.getElementById('infoProduto').style.display = 'none';
        document.getElementById('codigoBarras').focus();
    }
});

// Função para exportar os dados do IndexedDB para CSV
document.getElementById('botaoSalvarFinal').addEventListener('click', function () {
    const transacao = db.transaction(['inventario'], 'readonly');
    const store = transacao.objectStore('inventario');
    const request = store.getAll();

    request.onsuccess = function () {
        if (request.result.length === 0) {
            alert('Nenhum dado foi registrado.');
            return;
        }

        const cabecalho = ['Usuario', 'Produto', 'Local', 'Quantidade'];
        let conteudoCsv = cabecalho.join(';') + '\n' + request.result.map(item => `${item.usuario};${item.produto};${item.local};${item.quantidade}`).join('\n');
        const blob = new Blob([conteudoCsv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'inventario.csv';
        link.click();
        alert('Inventário salvo com sucesso!');
        limparIndexedDB();

    };
});

// Evento para navegar entre os campos pressionando "Enter"
document.getElementById('usuario').addEventListener('keydown', event => {
    if (event.key === 'Enter') {
        event.preventDefault();
        document.getElementById('local').focus();  // Foca no campo local
    }
});

// Outro evento para navegar entre os campos
document.getElementById('local').addEventListener('keydown', event => {
    if (event.key === 'Enter') {
        event.preventDefault();
        document.getElementById('codigoBarras').focus();  // Foca no campo código de barras
    }
});

// Função para limpar os campos
document.getElementById('botaoLimpar').addEventListener('click', function () {
    limparCampos();  // Chama a função para limpar os campos
});

// Função para limpar todos os campos do formulário
function limparCampos() {
    document.getElementById('codigoBarras').value = '';
    document.getElementById('quantidade').value = '';
    document.getElementById('detalhesProduto').textContent = 'Nenhum produto encontrado.';
    document.getElementById('infoProduto').style.display = 'none';
    document.getElementById('codigoBarras').focus();
}
