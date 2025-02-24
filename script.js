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
        itemLista.innerHTML = `<strong>${codigo}</strong> | <b>${codigoBarras}</b> - ${descricao} | ${embalagem}`;
        
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
    if(totalQuantidades != 0){
            tocarBip();
    }
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
                    if (!linha[1]) return false;  // Ignora produtos sem nome
                
                    const nomeProduto = linha[1].trim().toLowerCase();  // Nome do produto em minúsculas
                    const pesquisaNormalizada = pesquisa.trim().toLowerCase(); // Pesquisa normalizada em minúsculas
                
                    // Verifica se a pesquisa aparece no nome do produto respeitando a ordem das palavras
                    const regex = new RegExp(pesquisaNormalizada.split(/\s+/).join(".*?"), "i");
                
                    return regex.test(nomeProduto);
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
        const mensagem = document.getElementById('mensagemConfirmacao'); // Elemento onde será exibida a mensagem
        mensagem.style.display = 'block'; // Garante que o elemento seja visível

        if (isNaN(quantidade)) {
            mensagem.textContent = '❌ Insira uma quantidade válida.';
            mensagem.style.color = 'white';
            return;
        }

        if (quantidade > 5000) {
            mensagem.textContent = '❌ Quantidade muito alta! Digite um valor menor que 5000.';
            mensagem.style.color = 'white';
            return;
        }

        const produtoDetalhes = document.getElementById('detalhesProduto').textContent.trim();
        const usuario = document.getElementById('usuario').value.trim();

        if (!local || produtoDetalhes === 'Nenhum produto encontrado.') {
            mensagem.textContent = '❌ Preencha todos os campos corretamente.';
            mensagem.style.color = 'white';
            return;
        }

        // Obtém o código do produto e atualiza a quantidade total
        const codigoProduto = produtoDetalhes.split(' | ')[3].trim();


        quantidadesPorProduto[codigoProduto] = (quantidadesPorProduto[codigoProduto] || 0) + quantidade;

        salvarNoIndexedDB(usuario, produtoDetalhes, local, quantidade);

        // Exibe a mensagem de confirmação e reseta os campos
        mensagem.textContent = '✅ Quantidade registrada com sucesso!';
        mensagem.style.color = 'white';
        document.getElementById('quantidade').value = '';
        document.getElementById('codigoBarras').value = '';
        document.getElementById('detalhesProduto').textContent = 'Nenhum produto encontrado.';
        document.getElementById('infoProduto').style.display = 'none';
        document.getElementById('codigoBarras').focus();
    }
});


function tocarBip() {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sine'; // Tipo de som (onda senoidal)
    oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime); // Frequência do bip (1000 Hz)
    gainNode.gain.setValueAtTime(1.0, audioCtx.currentTime); // Volume reduzido para não ser incômodo

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    setTimeout(() => oscillator.stop(), 750); // Toca o som por 150ms
}


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

        const cabecalho = ['Usuario', 'CÓD.SISTEMA', 'EAN', 'Produto', 'EMB', 'Quantidade', 'Local'];
        let conteudoCsv = cabecalho.join('|') + '\n' + request.result.map(item => {
            // Divide o campo produto para extrair os detalhes
            const detalhesProduto = item.produto ? item.produto.split(' | ') : [];

            // Abaixo, mapeamos os valores específicos de cada parte
            const codigoSistema = detalhesProduto[0] || 'N/A';
            const ean = detalhesProduto[1] || 'N/A';
            const produtoDescricao = detalhesProduto[2] || 'N/A';
            const embalagem = detalhesProduto[3] || 'N/A';

            // Monta a linha do CSV
            return `${item.usuario}|${codigoSistema}|${ean}|${produtoDescricao}|${embalagem}|${item.quantidade}|${item.local}`;
        }).join('\n');

        const blob = new Blob([conteudoCsv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'inventario.csv';

        // Simula o clique no link para iniciar o download
        link.click();

        // Exibe um botão de confirmação para limpar os dados depois do download
        exibirBotaoConfirmacao();
    };
});


// Função para exibir o botão de confirmação após o download
function exibirBotaoConfirmacao() {
    const botaoConfirmarLimpeza = document.createElement('button');
    botaoConfirmarLimpeza.textContent = "Confirmar que o inventário foi salvo";
    botaoConfirmarLimpeza.style.display = 'block';
    botaoConfirmarLimpeza.style.margin = '10px';
    botaoConfirmarLimpeza.style.padding = '10px';
    botaoConfirmarLimpeza.style.backgroundColor = '#d9534f';
    botaoConfirmarLimpeza.style.color = 'white';
    botaoConfirmarLimpeza.style.border = 'none';
    botaoConfirmarLimpeza.style.cursor = 'pointer';

    // Quando o usuário confirmar, aí sim limpamos o IndexedDB
    botaoConfirmarLimpeza.addEventListener('click', function () {
        limparIndexedDB();
        botaoConfirmarLimpeza.remove(); // Remove o botão após a confirmação
    });

    // Adiciona o botão ao corpo do documento
    document.body.appendChild(botaoConfirmarLimpeza);
}


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
