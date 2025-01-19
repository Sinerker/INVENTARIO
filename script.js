// Variável para armazenar os dados do CSV após carregado
let dadosCsv = [];
let inventario = []; // Inventário sem salvar no localStorage
let quantidadesPorProduto = {}; // Armazenar as quantidades totais por produto

// Carregar o arquivo CSV
document.getElementById('uploadArquivo').addEventListener('change', function(e) {
    var arquivo = e.target.files[0];
    var leitor = new FileReader();

    leitor.onload = function(evento) {
        // Extrai o conteúdo do arquivo
        let conteudo = evento.target.result;

        // Quebra o conteúdo do CSV em linhas
        dadosCsv = conteudo.split('\n').map(linha => linha.split(';'));

        // Exibe a mensagem de sucesso ao carregar o arquivo
        document.getElementById('mensagemUpload').style.display = 'block';
    };

    if (arquivo) {
        leitor.readAsText(arquivo);
    }
});

// Procurar o código digitado e exibir as informações apenas quando "Enter" for pressionado
document.getElementById('codigoBarras').addEventListener('keydown', function(evento) {
    if (evento.keyCode === 13) {
        const codigo = this.value.trim();

        if (!codigo) {
            document.getElementById('infoProduto').style.display = 'none';
            return;
        }

        const produto = dadosCsv.find(linha => linha[3] && linha[3].trim() === codigo);

        if (produto) {
            document.getElementById('detalhesProduto').textContent = produto.join(' | ');
            document.getElementById('infoProduto').style.display = 'block';
            document.getElementById('quantidade').focus();
            

            // Exibe a quantidade total registrada anteriormente
            const produtoChave = produto[3].trim(); // Usamos o código de barras como chave
            const totalQuantidades = quantidadesPorProduto[produtoChave] || 0;
            document.getElementById('quantidade').value = totalQuantidades;
            const campoQuantidade = document.getElementById('quantidade');
            campoQuantidade.select();

        } else {
            document.getElementById('detalhesProduto').textContent = 'Produto não encontrado.';
            document.getElementById('infoProduto').style.display = 'block';
        }
    }
});

// Salvar os dados do produto no inventário quando a tecla "Enter" for pressionada no campo "quantidade"
document.getElementById('quantidade').addEventListener('keydown', function(evento) {
    if (evento.keyCode === 13) {
        const local = document.getElementById('local').value.trim();
        let quantidade = this.value.trim();

        // Verifica se a quantidade é um número (float ou inteiro)
        quantidade = parseFloat(quantidade);

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

        // Cria a linha com todos os dados concatenados corretamente
        const linhaProduto = `${usuario};${produtoDetalhes};${local};${quantidade}`;

        // Adiciona a linha ao inventário
        inventario.push(linhaProduto);

        // Extrair o código de barras (produto chave)
        const produtoChave = produtoDetalhes.split(' | ')[3].trim(); // Pega o código de barras da string de detalhes

        // Atualiza a quantidade total para aquele produto
        if (quantidadesPorProduto[produtoChave]) {
            quantidadesPorProduto[produtoChave] += quantidade;
        } else {
            quantidadesPorProduto[produtoChave] = quantidade;
        }

        // Exibe a confirmação
        document.getElementById('mensagemConfirmacao').style.display = 'block';

        // Limpa os campos "local" e "quantidade" para continuar o inventário
        document.getElementById('quantidade').value = '';
        document.getElementById('codigoBarras').value = '';
        document.getElementById('detalhesProduto').textContent = 'Nenhum produto encontrado.';
        document.getElementById('infoProduto').style.display = 'none';

        // Coloca o foco de volta no campo de código de barras
        document.getElementById('codigoBarras').focus();
    }
});

// Função para gerar e baixar o arquivo CSV com os dados do inventário
document.getElementById('botaoSalvarFinal').addEventListener('click', function() {
    if (inventario.length === 0) {
        alert('Nenhum dado de inventário foi registrado.');
        return;
    }

    const confirmacao = confirm('Você tem certeza que deseja salvar o inventário?');

    if (confirmacao) {
        const cabecalho = ['Usuario', 'Produto', 'Local', 'Quantidade'];
        let conteudoCsv = cabecalho.join(';') + '\n';

        inventario.forEach(item => {
            const itemComVirgula = item.replace('.', ',');
            conteudoCsv += `${itemComVirgula}\n`;
        });

        // Cria um Blob com a codificação UTF-8
        const blob = new Blob([conteudoCsv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'inventario.csv';
        link.click();

        alert('Inventário salvo com sucesso!');
    } else {
        alert('Download cancelado!');
    }
});

// Forçar o salvamento dos dados antes de fechar ou recarregar a página
window.addEventListener('beforeunload', function(event) {
    if (inventario.length > 0) {
        // Impede a página de ser fechada ou recarregada imediatamente
        event.preventDefault();
        event.returnValue = ''; // Exibe uma mensagem de confirmação (depende do navegador)
        
        // Chama a função de salvar o inventário
        salvarInventario();
    }
});

// Função para gerar e baixar o arquivo CSV com os dados do inventário
function salvarInventario() {
    if (inventario.length === 0) {
        alert('Nenhum dado de inventário foi registrado.');
        return;
    }

    const confirmacao = confirm('Você tem certeza que deseja salvar o inventário?');

    if (confirmacao) {
        const cabecalho = ['Usuario', 'Produto', 'Local', 'Quantidade'];
        let conteudoCsv = cabecalho.join(';') + '\n';

        inventario.forEach(item => {
            const itemComVirgula = item.replace('.', ',');
            conteudoCsv += `${itemComVirgula}\n`;
        });

        // Cria um Blob com a codificação UTF-8
        const blob = new Blob([conteudoCsv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'inventario.csv';
        link.click();

        alert('Inventário salvo com sucesso!');
    } else {
        alert('Download cancelado!');
    }
}
