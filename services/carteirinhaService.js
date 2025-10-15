const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const { supabaseAdmin } = require('../supabase');
const { obterConfiguracaoCarteirinha } = require('../config/carteirinha');

/**
 * Serviço para geração de carteirinhas
 */
class CarteirinhaService {
  
  /**
   * Testar conectividade com Supabase Storage
   */
  async testarConectividadeSupabase() {
    try {
      console.log('🧪 Testando conectividade com Supabase Storage...');
      
      // Testar listagem de buckets
      const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();
      
      if (bucketsError) {
        console.error('❌ Erro ao listar buckets:', bucketsError);
        return {
          success: false,
          error: `Erro ao listar buckets: ${bucketsError.message}`,
          buckets: []
        };
      }
      
      console.log('✅ Buckets encontrados:', buckets?.map(b => b.name));
      
      // Verificar se o bucket feperj existe
      const bucketExiste = buckets?.some(bucket => bucket.name === 'feperj');
      
      if (!bucketExiste) {
        console.warn('⚠️ Bucket feperj não encontrado');
        return {
          success: false,
          error: 'Bucket "feperj" não encontrado',
          buckets: buckets?.map(b => b.name) || []
        };
      }
      
      console.log('✅ Bucket feperj encontrado');
      
      return {
        success: true,
        error: null,
        buckets: buckets?.map(b => b.name) || []
      };
    } catch (error) {
      console.error('❌ Erro geral na conectividade:', error);
      return {
        success: false,
        error: `Erro geral: ${error.message}`,
        buckets: []
      };
    }
  }

  /**
   * Carregar modelo de carteirinha do Supabase Storage
   */
  async carregarModelo() {
    try {
      console.log('📄 Carregando modelo de carteirinha do Supabase...');
      
      // Tentar buscar modelo personalizado primeiro
      const { data: arquivos, error: listError } = await supabaseAdmin.storage
        .from('feperj')
        .list('modelos', {
          limit: 10,
          offset: 0
        });

      if (!listError && arquivos && arquivos.length > 0) {
        // Procurar pelo arquivo de modelo
        const modeloFile = arquivos.find(file => 
          file.name.toLowerCase().includes('carteirinha') && 
          file.name.toLowerCase().endsWith('.pdf')
        );
        
        if (modeloFile) {
          console.log('📄 Modelo encontrado:', modeloFile.name);
          
          // Baixar o arquivo (usando bucket feperj)
          const { data, error: downloadError } = await supabaseAdmin.storage
            .from('feperj')
            .download(`modelos/${modeloFile.name}`);

          if (!downloadError && data) {
            const arrayBuffer = await data.arrayBuffer();
            const modeloBytes = new Uint8Array(arrayBuffer);
            console.log('✅ Modelo carregado com sucesso do Supabase');
            return modeloBytes;
          }
        }
      }

      console.log('⚠️ Modelo personalizado não encontrado, usando modelo local...');
      return await this.carregarModeloLocal();
      
    } catch (error) {
      console.error('Erro ao carregar modelo do Supabase:', error);
      console.log('Tentando modelo local como fallback...');
      return await this.carregarModeloLocal();
    }
  }

  /**
   * Carregar modelo local como fallback
   */
  async carregarModeloLocal() {
    try {
      console.log('📄 Carregando modelo local...');
      
      // Tentar diferentes caminhos para o modelo
      const caminhosModelo = [
        path.join(__dirname, '../modelo-carteirinha.pdf'),
        path.join(__dirname, '../carteirinha_modelo.pdf'),
        path.join(__dirname, '../public/modelos/carteirinha_modelo.pdf')
      ];
      
      for (const caminho of caminhosModelo) {
        if (fs.existsSync(caminho)) {
          console.log('✅ Modelo local encontrado:', caminho);
          return fs.readFileSync(caminho);
        }
      }
      
      throw new Error('Nenhum modelo local encontrado');
      
    } catch (error) {
      console.error('Erro ao carregar modelo local:', error);
      throw new Error('Não foi possível carregar o modelo de carteirinha');
    }
  }

  /**
   * Carregar foto 3x4 do Supabase Storage
   */
  async carregarFoto3x4(atletaId) {
    try {
      console.log('📸 Carregando foto 3x4 do atleta:', atletaId);
      
      // Listar arquivos do atleta (usando bucket feperj)
      const { data: arquivos, error: listError } = await supabaseAdmin.storage
        .from('feperj')
        .list(atletaId, {
          limit: 100,
          offset: 0
        });

      if (listError) {
        throw new Error(`Erro ao listar arquivos: ${listError.message}`);
      }

      // Procurar pela foto 3x4
      const fotoFile = arquivos.find(file => 
        file.name.toLowerCase().startsWith('foto_3x4_')
      );
      
      if (!fotoFile) {
        throw new Error('Foto 3x4 não encontrada');
      }

      console.log('📸 Foto 3x4 encontrada:', fotoFile.name);
      
      // Baixar a foto (usando estrutura feperj)
      const { data, error: downloadError } = await supabaseAdmin.storage
        .from('feperj')
        .download(`${atletaId}/${fotoFile.name}`);

      if (downloadError) {
        throw new Error(`Erro ao baixar foto: ${downloadError.message}`);
      }

      const arrayBuffer = await data.arrayBuffer();
      const fotoBytes = new Uint8Array(arrayBuffer);
      
      console.log('✅ Foto 3x4 carregada com sucesso');
      return fotoBytes;
      
    } catch (error) {
      console.error('Erro ao carregar foto 3x4:', error);
      throw new Error(`Não foi possível carregar a foto 3x4: ${error.message}`);
    }
  }

  /**
   * Gerar matrícula do atleta
   */
  gerarMatricula(cpf) {
    if (!cpf) return '';
    const cpfLimpo = cpf.replace(/\D/g, '');
    const anoAtual = new Date().getFullYear();
    return cpfLimpo.substring(0, 5) + anoAtual;
  }

  /**
   * Formatar data para exibição
   */
  formatarData(data) {
    if (!data) return '';
    const date = new Date(data);
    return date.toLocaleDateString('pt-BR');
  }

  /**
   * Limpar nome para arquivo
   */
  limparNomeParaArquivo(nome) {
    return nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);
  }

  /**
   * Gerar carteirinha individual
   */
  async gerarCarteirinha(atleta, equipe) {
    try {
      console.log('🎯 Gerando carteirinha para:', atleta.nome);
      
      // Carregar modelo PDF
      const modeloBytes = await this.carregarModelo();
      const pdfDoc = await PDFDocument.load(modeloBytes);
      
      // Obter a primeira página do modelo
      const pages = pdfDoc.getPages();
      if (pages.length === 0) {
        throw new Error('Modelo PDF não contém páginas');
      }
      
      const page = pages[0];
      const { width, height } = page.getSize();
      
      console.log('📄 Dimensões da página:', { width, height });
      
      // Carregar fontes
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      // Obter configuração da carteirinha
      const config = obterConfiguracaoCarteirinha();
      const campos = config.campos;
      
      // Preparar dados do atleta
      const nome = atleta.nome || '';
      const dataNascimento = this.formatarData(atleta.dataNascimento);
      const nomeEquipe = equipe?.nomeEquipe || 'SEM EQUIPE';
      const validade = new Date().getFullYear().toString();
      const cidade = equipe?.cidade || '';
      const matricula = atleta.matricula || this.gerarMatricula(atleta.cpf);
      
      console.log('📝 Dados a serem preenchidos:', {
        nome,
        dataNascimento,
        nomeEquipe,
        validade,
        cidade,
        matricula
      });
      
      // Preencher campos de texto com cor branca (replicando sistema frontend)
      console.log('🎨 Desenhando nome:', nome, 'em', campos.nome.x, campos.nome.y);
      page.drawText(nome, {
        x: campos.nome.x,
        y: campos.nome.y,
        size: campos.nome.fontSize,
        font: boldFont,
        color: rgb(1, 1, 1) // Branco para legibilidade no fundo escuro
      });
      
      console.log('🎨 Desenhando data:', dataNascimento, 'em', campos.dataNascimento.x, campos.dataNascimento.y);
      page.drawText(dataNascimento, {
        x: campos.dataNascimento.x,
        y: campos.dataNascimento.y,
        size: campos.dataNascimento.fontSize,
        font: font,
        color: rgb(1, 1, 1) // Branco
      });
      
      console.log('🎨 Desenhando equipe:', nomeEquipe, 'em', campos.equipe.x, campos.equipe.y);
      page.drawText(nomeEquipe, {
        x: campos.equipe.x,
        y: campos.equipe.y,
        size: campos.equipe.fontSize,
        font: font,
        color: rgb(1, 1, 1) // Branco
      });
      
      console.log('🎨 Desenhando validade:', validade, 'em', campos.validade.x, campos.validade.y);
      page.drawText(validade, {
        x: campos.validade.x,
        y: campos.validade.y,
        size: campos.validade.fontSize,
        font: font,
        color: rgb(1, 1, 1) // Branco
      });
      
      console.log('🎨 Desenhando cidade:', cidade, 'em', campos.cidade.x, campos.cidade.y);
      page.drawText(cidade, {
        x: campos.cidade.x,
        y: campos.cidade.y,
        size: campos.cidade.fontSize,
        font: font,
        color: rgb(1, 1, 1) // Branco
      });
      
      console.log('🎨 Desenhando matrícula:', matricula, 'em', campos.matricula.x, campos.matricula.y);
      page.drawText(matricula, {
        x: campos.matricula.x,
        y: campos.matricula.y,
        size: campos.matricula.fontSize,
        font: font,
        color: rgb(1, 1, 1) // Branco
      });
      
      // Inserir foto 3x4 se disponível
      try {
        console.log('📸 Tentando inserir foto 3x4...');
        const fotoBytes = await this.carregarFoto3x4(atleta.id);
        
        // Determinar tipo de imagem
        let imageType = 'jpg';
        if (fotoBytes[0] === 0x89 && fotoBytes[1] === 0x50) {
          imageType = 'png';
        }
        
        console.log('📸 Tipo de imagem detectado:', imageType);
        
        const image = imageType === 'png' 
          ? await pdfDoc.embedPng(fotoBytes)
          : await pdfDoc.embedJpg(fotoBytes);
        
        console.log('📸 Imagem embedada no PDF');
        
        // Inserir imagem na posição configurada
        page.drawImage(image, {
          x: campos.foto.x,
          y: campos.foto.y,
          width: campos.foto.width,
          height: campos.foto.height
        });
        
        console.log('✅ Foto 3x4 inserida com sucesso');
      } catch (error) {
        console.warn('⚠️ Não foi possível inserir foto 3x4:', error.message);
        // Continuar sem a foto
      }
      
      // Salvar PDF
      const pdfBytes = await pdfDoc.save();
      console.log('✅ Carteirinha gerada com sucesso');
      
      return pdfBytes;
      
    } catch (error) {
      console.error('Erro ao gerar carteirinha:', error);
      throw new Error(`Erro ao gerar carteirinha: ${error.message}`);
    }
  }

  /**
   * Gerar carteirinhas em lote
   */
  async gerarCarteirinhasEmLote(dados) {
    console.log(`🎯 Gerando ${dados.length} carteirinhas em lote...`);
    
    const carteirinhas = [];
    
    for (let i = 0; i < dados.length; i++) {
      try {
        console.log(`📄 Gerando carteirinha ${i + 1}/${dados.length}: ${dados[i].atleta.nome}`);
        const carteirinha = await this.gerarCarteirinha(dados[i].atleta, dados[i].equipe);
        carteirinhas.push({
          atleta: dados[i].atleta,
          pdfBytes: carteirinha
        });
      } catch (error) {
        console.error(`Erro ao gerar carteirinha ${i + 1}:`, error);
        // Continuar com as outras carteirinhas
      }
    }
    
    console.log(`✅ ${carteirinhas.length} carteirinhas geradas com sucesso`);
    return carteirinhas;
  }
}

module.exports = new CarteirinhaService();
