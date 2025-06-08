# Home Assistant Community Add-on: GWM Brasil com MQTT

## Sobre

Este add-on permite a integração do Home Assistant com os veículos da **GWM Brasil** utilizando MQTT. Com essa integração, é possível monitorar e controlar várias funcionalidades do veículo diretamente pelo Home Assistant.
Você precisa ter uma instância do Home Assistant com o add-on `Mosquitto Broker` instalado e configurado. Caso esteja instalando o `Mosquitto Broker` somente para esta integração, lembre-se de reiniciar sua instância do Home Assistant após a instalação.

[![Add Add-on to Home Assistant](https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg)](https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https%3A%2F%2Fgithub.com%2Fhavaleiros%2Fhassio-haval-h6-to-mqtt)

## O que é o Home Assistant?

O **Home Assistant** é uma plataforma de automação residencial de código aberto que permite integrar e controlar dispositivos inteligentes de diferentes fabricantes em um único lugar. Ele é altamente personalizável e pode ser executado em dispositivos como Raspberry Pi, servidores locais ou até mesmo na nuvem.

Com o Home Assistant, você pode criar automações avançadas, dashboards personalizados e monitorar o status de seus dispositivos em tempo real. É uma solução ideal para quem busca centralizar o controle de sua casa inteligente.

### Links úteis:
- [Site oficial do Home Assistant](https://www.home-assistant.io/)
- [Fórum oficial do Home Assistant](https://community.home-assistant.io/)
- [Fórum Home Assistant Brasil](https://forum.homeassistantbrasil.com.br/)

### Dica:
Se você está começando, recomendamos pesquisar no YouTube por tutoriais sobre o Home Assistant. Há uma grande quantidade de vídeos em português e inglês que podem ajudar na instalação, configuração e uso da plataforma.

### Passo a Passo para adicionar o add-on ao Home Assistant

#### 1. Adicionando o Repositório do Add-on

1. Acesse a interface web do Home Assistant.
2. Navegue até **Supervisor** no menu lateral.
3. Selecione a aba **Add-on Store**.
4. Clique nos três pontos no canto superior direito e selecione **Repositórios**.
5. Adicione o URL do repositório do add-on: https://github.com/havaleiros/hassio-haval-h6-to-mqtt
6. Clique em **Adicionar** e, em seguida, feche a janela de repositórios.

#### 2. Instalando o Add-on

1. Na aba **Add-on Store**, role para baixo até encontrar o repositório que você acabou de adicionar.
2. Selecione o add-on **GWM Brasil com MQTT**.
3. Clique em **Instalar** e aguarde a conclusão da instalação.

#### 3. Configurando o Add-on

1. Após a instalação, vá até a aba **Ajustes** do add-on.
2. Configure os parâmetros necessários como endereço do broker MQTT, credenciais, e outras opções específicas para os veículos GWM.
```yaml
gwm_username: conta_de_email_vinculada_ao_app_MyGWM
gwm_password: senha_do_app_MyGWM
gwm_vin: CHASSIS_DO_CARRO_PRINCIPAL_COM_LETRAS_MAIÚSCULAS
gwm_pin: senha_de_ativação_de_comandos_no_app_MyGWM
mqtt_server: mqtt://homeassistant.local:1883
mqtt_user: nome_de_usuario_do_mqtt
mqtt_pass: senha_do_mqtt
refresh_time: tempo_em_segundos (mínimo de 5 segundos)
device_tracker_enabled: true [ou] false
```

![Ajustes dos add-on](https://raw.githubusercontent.com/havaleiros/hassio-haval-h6-to-mqtt/main/haval-h6-mqtt/images/addon_settings.png)

Nota: Caso os campos para configuração do MQTT não esteja, disponíveis na tela, ative a opção _Mostrar opções de configuração opcionais não utilizadas_ ao final da tela.

3. Salve as configurações.
4. Iniciando o Add-on
- Volte para a aba Informação do add-on.
- Clique em _Iniciar_ para inicializar o add-on.
- Habilite a opção _Iniciar_ na Inicialização se desejar que o add-on inicie automaticamente junto com o Home Assistant.
5. Verificando a Integração
- Vá para _Configuração_ no menu lateral do Home Assistant.
- Selecione _Ferramentas de desenvolvedor_.
- Verifique se as entidades iniciadas com *sensor.gwmbrasil_* estão listados na aba _Estado_.
- Agora, você deve ser capaz de monitorar o seu veículo diretamente pelo painel do Home Assistant.

==========================================================
### OPCIONAL - Instalações core ou não-supervisionadas ###

Esta sessão é destinada somente para instalações que não possuam o **Home Assistant Supervisor** em suas instâncias locais, necessitando da configuração manual do add-on em um container para execução.
Pule esta etapa se sua instância conta com o **Home Assistant Supervisor**.

#### Adicionando o Add-on diretamente via Docker para instalações do Home Assistant não Supervisionadas (Core ou Container)

**Premissas**:

1. Possuir um ambiente Linux (preferencialmente Debian) com o Home Assistant Core ou Container previamente instalado e totalmente funcional via `docker-compose.yaml`
2. Possuir o serviço `Mosquitto Broker` previamente instalado (nome do container deve ser: `mosquitto`), totalmente funcional e configurado via Integração dentro da Instalação do Home Assistant
3. Estar logado com o usuário `root` no Linux
4. Instalar os pacotes necessários para a instalação
```yaml
sudo apt-get install npm
```

#### 1. Criando a estutura do Add-on dentro do servidor Home Assistant

1. Clonar repositório GitHub:
```yaml
cd /opt
git clone https://github.com/havaleiros/hassio-haval-h6-to-mqtt.git
```
2. Criar o Dockerfile:
```yaml
sudo nano /opt/hassio-haval-h6-to-mqtt/Dockerfile
```
3. Incluir o Conteúdo abaixo:
```yaml
FROM node:20-alpine

WORKDIR /app

COPY haval-h6-mqtt/ .

RUN npm ci --only=production

EXPOSE 3000

CMD ["node", "index.js"]
```
4. `CTRL+O` + `ENTER` para salvar
5. `CTRL+X` para sair

#### 2. Configurando as credenciais de acesso dentro das variáveis de ambiente

1. Editar o ENV File:
```yaml
sudo nano /opt/hassio-haval-h6-to-mqtt/haval-h6.env
```
2. Incluir o Conteúdo abaixo, editando os dados pessoais:
```yaml
USERNAME=XXXX
PASSWORD=XXXX
VIN=XXXX
PIN=XXXX
REFRESH_TIME=5
DEVICE_TRACKER_ENABLED=true
MQTT_USER=XXXX
MQTT_PASS=XXXX
MQTT_HOST=mqtt://IP_DO_SERVER_MQTT:1883
```
3. `CTRL+O` + `ENTER` para salvar
4. `CTRL+X` para sair

#### 3. Configurando o Serviço dentro do Docker

1. Acessar o diretório que contém o `docker-compose.yaml`
2. Editar o arquivo:
```yaml
sudo nano docker-compose.yaml
```
3. Adicionar ao conteúdo do arquivo:
```yaml
  hassio-haval-h6-to-mqtt:
    container_name: hassio-haval-h6-to-mqtt
    build:
      context: /opt/hassio-haval-h6-to-mqtt
      dockerfile: Dockerfile
    depends_on:
      mosquitto:
        condition: service_started
    restart: always
    volumes:
      - /opt/hassio-haval-h6-to-mqtt/data:/hassio-haval-h6-to-mqtt/data
    ports:
      - 10001:10001
    env_file:
      - /opt/hassio-haval-h6-to-mqtt/haval-h6.env
```
4. `CTRL+O` + `ENTER` para salvar
5. `CTRL+X` para sair
6. Subir Container:
```yaml
docker compose up -d
```

#### 4. Acessar as entidades via MQTT

- Acessar sua instalação do Home Assistant e recarregar a integração MQTT para que as entidades sejam corretamente lidas pelo sistema.
- Caso alguma entidade apresente status indisponível, dê um restart no container `hassio-haval-h6-to-mqtt`.

### Configurar um novo Dashboard em seu Home Assistant

Utilizar um novo dashboard evita a edição e impactos em dashboards existentes.

==========================================================

#### Adicionando Imagens do Veículo

1. Baixe o arquivo [Baixe aqui o arquivo haval_h6.zip](https://github.com/havaleiros/hassio-haval-h6-to-mqtt/raw/main/haval-h6-mqtt/files/haval_h6.zip).
2. Descompacte o arquivo e salve as imagens na pasta `www/images/haval_h6` do Home Assistant.

O resultado esperado é que as imagens devem ficar no caminho `www/images/haval_h6/[imagem].png`. Dependendo da ferramenta utilizada o caminho pode ser exibido como `homeassistant/www/images/haval_h6/[imagem].png`.
Não salve o arquivo `haval_h6.zip` diretamente no diretório do Home Assistant, pois isto não terá efeito no uso das imagens. 

#### Dica
Recomenda-se o uso do Add-on [Samba share](https://github.com/home-assistant/addons/tree/master/samba) para acesso na pasta `www` de sua instância do Home Assistant.
Desta forma não haverá necessidde de copiar imagem por imagem para a pasta.

Caso a pasta `www` não exista em sua estrutura de pastas, você pode criá-la. Utilize o add-on `File Editor` ou o `Studio Code Server` para editar diretamente pelo browser.

#### Instalando Custom Cards

Para uma melhor experiência visual, é necessário instalar alguns custom cards através do HACS (Home Assistant Community Store).

Os seguintes custom cards são necessários:

- [stack-in-card](https://github.com/custom-cards/stack-in-card)
- [button-card](https://github.com/custom-cards/button-card)
- [mushroom-title-card](https://github.com/piitaya/lovelace-mushroom)
- [template-entity-row](https://github.com/thomasloven/lovelace-template-entity-row)
- [card-mod](https://github.com/thomasloven/lovelace-card-mod)
- [bar-card](https://github.com/custom-cards/bar-card)
- [fold-entity-row](https://github.com/thomasloven/lovelace-fold-entity-row)
- [config-template-card](https://github.com/iantrich/config-template-card) - _Utilize a versão `1.3.7-beta.1` do `config-template-card`_.
- [lovelace-collapsable-cards](https://github.com/RossMcMillan92/lovelace-collapsable-cards)
- [mini-graph-card](https://github.com/kalkih/mini-graph-card)
- [html-template-card](https://github.com/PiotrMachowski/Home-Assistant-Lovelace-HTML-Jinja2-Template-card)
- [havaleiros-charging-hist-card](https://github.com/havaleiros/hassio-havaleiros-charging-hist-card) - Nosso card para exibir o histórico de carregamento.
- [map-card](https://github.com/nathan-gs/ha-map-card) - Para àqueles que forem utilizar a opção de dashboard com mapa de rastreamento fom filtro.

### Passo a Passo para adicionar um novo repositório no HACS

1. Certifique-se de que o HACS já está instalado e configurado no seu Home Assistant. Caso ainda não tenha instalado, siga o [guia de instalação do HACS](https://hacs.xyz/docs/use/).

2. Acesse a interface web do Home Assistant.
3. No menu lateral, clique em **HACS**.
4. No canto superior direito da tela, clique no ícone de três pontos verticais e selecione **Custom repositories** (Repositórios personalizados).
5. Na janela que abrir, insira o URL do repositório que deseja adicionar no campo **Repository**. Por exemplo:
  ```
  https://github.com/custom-cards/button-card
  ```
6. No campo **Category**, selecione a categoria apropriada para o repositório. As opções geralmente incluem:
  - **Template**
  - **Dashboard** (Painel)
  - **Theme** (Tema)
  - **Integration** (Integração)
7. Clique em **Add** (Adicionar) para salvar o repositório.
8. Após adicionar o repositório, ele estará disponível na seção correspondente do HACS. Navegue até a categoria apropriada, localize o repositório e clique em **Install** (Instalar) para adicioná-lo ao seu Home Assistant.
9. Reinicie o Home Assistant, se necessário, para aplicar as alterações.

Agora, o repositório estará configurado e pronto para uso no seu Home Assistant.

#### Adicionando um Novo Dashboard

1. Acesse a interface web do Home Assistant.
2. Navegue até **Configurações** no menu lateral.
3. Selecione **Dashboards**.
4. Clique em **Adicionar Dashboard**.
5. Atribua o título como `GWM Brasil` e o ícone como `mdi:car-electric`. Ative a opção `Mostrar na barra lateral` e clique em _CRIAR_.
6. Na nova linha criada com o novo dashboard, clique em _ABRIR_.
7. No canto superior esquerdo da tela, clique em _Editar dashboard_.
8. Clique novamente no símbolo com 3 pontos verticais e depois em _Editor de configuração RAW_.
9. Apague o conteúdo existente que será exibido, copie o conteúdo do arquivo `HomeAssistant_Dashboard_Haval.yaml` fornecido como template e cole nesta tela. [Baixe aqui o arquivo YAML](https://github.com/havaleiros/hassio-haval-h6-to-mqtt/blob/main/haval-h6-mqtt/files/HomeAssistant_Dashboard_Haval.yaml). Consulte sempre a data de atualização do arquivo para identificar se há uma versão mais recente. 

Agora, seu novo dashboard estará configurado para exibir informações detalhadas sobre o seu veículo GWM.
Você poderá, além de monitorar as informações do veículo, ligar o ar condicionado e interromper o carregamento, para soltar o plugue do carregador antes da finalização da carga.

Nota 1: _Há também a opção `HomeAssistant_Dashboard_Haval_Mapa.yaml` que fornece o mapa de rastreamento com filtro de data._ No entato, esta necessita de uma intervenção manual. Localize o conteúdo `{{chassis}}` e o substitua pelo chassis do veículo que quer monitorar, sempre em letras minúsculas. Esta opção não permite a mudança dinâmica para àqueles que possuam dois ou mais veículos devido à uma incompatibilidade do card `map-card` utilizado para esta exibição quando trabalhando em conjunto com o card `config-template-card`.

Nota 2: Caso a pressão dos pneus seja exibida com a unidade de medida `kPa`, toque sobre cada entidade na lista Pneus - do lado direito do dashboard - e toque no ícone de engrenagem, _Configurações_. Altere a unidade de medida para `psi`.

![Exemplo de painel no Home Assistant](https://raw.githubusercontent.com/havaleiros/hassio-haval-h6-to-mqtt/main/haval-h6-mqtt/images/HomeAssistant_Example.png)

### Configuração do controle do ar condicionado via Smart Watch no Home Assistant Companion

A configuração para smart watch funciona tanto para Android, quanto para iOS. No entanto, este guia aborda somente a configuração para iOS.
Verifique a documentação do Home Assistant para a configuração para dispositivos Android.

#### Adicionando "ios" e as configurações de botões no `configuration.yaml`

Para integrar o controle do ar-condicionado do Haval H6 com o Home Assistant, siga os seguintes passos para configurar o `configuration.yaml`:

1. **Adicionando o componente iOS:**
O Home Assistant tem suporte para dispositivos iOS nativamente, permitindo que você receba notificações e execute automações através do seu iPhone ou iPad.

No seu arquivo `configuration.yaml`, adicione a seguinte linha para habilitar o suporte ao iOS:

```yaml
ios:
  actions:
    - name: AC Haval
      background_color: "#141717"
      label:
        text: "Ligar A/C"
        color: "#FFFFFF"
      icon:
        icon: mdi:car-estate
        color: "#FFFFFF"
    - name: Interromper carregamento
      background_color: "#FF0000"
      label:
        text: "Parar carga"
        color: "#FFFFFF"
      icon:
        icon: mdi:ev-plug-type2
        color: "#FFFFFF"
```

2. **Configurando os botões em seu aplicativo para Smart Watch:**
Para integrar os controles de seu veículo em seu smart watch, certifique-se de seguir as instruções de instalação deste repositório, e então adicione a automação ou entidade correspondente ao ar-condicionado no seu Home Assistant. Um exemplo de configuração dos botões pode ser visto abaixo e utilizado seguindo os passos.

#### Passo a Passo para adicionar no `automation.yaml`:

1. Acesse o arquivo `automation.yaml` da sua instalação do Home Assistant.
2. Adicione a seguinte automação ao final do arquivo ou em uma seção apropriada:
  ```yaml
  - alias: "Acionamento temporário do A/C do veículo"
    initial_state: true
    trigger:
     - platform: event
      event_type: ios.action_fired
      event_data:
        actionName: "AC Haval"
    action:
     - service: button.press
      target:
        entity_id: button.gwmbrasil_{chassis}_ativacao_do_ar_condicionado

  - alias: "Interromper carregamento"
    initial_state: true
    trigger:
     - platform: event
      event_type: ios.action_fired
      event_data:
        actionName: "Interromper carregamento"
    action:
     - service: button.press
      target:
        entity_id: button.gwmbrasil_{chassis}_interromper_carregamento
  ```  
3. Substitua `{chassis}` pelo código de chassis do seu veículo, utilizando letras minúsculas. Remova também as chaves ({}) na substituição.
4. Salve o arquivo.
5. Reinicie o Home Assistant para aplicar as alterações.

Agora, os controles estarão configurados e poderá ser acionado diretamente pelos botões no aplicativo Home Assistant Companion em seu smart watch. _Caso tenha problemas em atualizar as opções exibidas no relógio, remova o aplicativo via celular e instale novamente_.

![Botão no Apple Watch](https://raw.githubusercontent.com/havaleiros/hassio-haval-h6-to-mqtt/main/haval-h6-mqtt/images/HA_Companion_watchOS.png)

### Automações e avisos com NodeRed

#### O que é o NodeRed?

O **NodeRed** é uma ferramenta de desenvolvimento baseada em fluxo que permite criar automações e integrações de forma visual e intuitiva. Ele é amplamente utilizado para conectar dispositivos, APIs e serviços, sendo uma excelente opção para criar automações avançadas no Home Assistant.

Com o NodeRed, você pode criar fluxos personalizados para monitorar e controlar dispositivos, enviar notificações e executar ações com base em eventos específicos.

#### Como instalar o NodeRed no Home Assistant?

1. Acesse a interface web do Home Assistant.
2. Navegue até **Supervisor** no menu lateral.
3. Clique na aba **Add-on Store**.
4. Procure por **Node-RED** na lista de add-ons disponíveis.
5. Clique em **Node-RED** e, em seguida, clique em **Instalar**.
6. Após a instalação, vá até a aba **Configuração** do add-on e configure as opções desejadas.
7. Salve as configurações e volte para a aba **Informação**.
8. Clique em **Iniciar** para inicializar o NodeRed.
9. Habilite a opção **Iniciar na Inicialização** para que o NodeRed seja iniciado automaticamente junto com o Home Assistant.

#### Como importar o arquivo de exemplo `files/nodered_flow_Haval.json`?

1. Acesse o NodeRed através do menu lateral do Home Assistant.
2. No canto superior direito da interface do NodeRed, clique no ícone de menu (três linhas horizontais).
3. Selecione **Importar** no menu suspenso.
4. Clique em **Selecionar arquivo** e escolha o arquivo `files/nodered_flow_Haval.json` que você baixou do repositório.
5. Após carregar o arquivo, clique em **Importar** para adicionar o fluxo ao seu ambiente NodeRed.
6. Ajuste as configurações do fluxo, como credenciais e entidades específicas, conforme necessário.
7. Clique em **Implantar** no canto superior direito para ativar o fluxo.

![Exemplo de fluxo no Node-RED](https://raw.githubusercontent.com/havaleiros/hassio-haval-h6-to-mqtt/main/haval-h6-mqtt/images/Node-RED_Example.png)

#### Observação importante

Este é apenas um exemplo de fluxo. É necessário editá-lo antes de utilizá-lo, substituindo todas as ocorrências de `{chassis}` pelo número do chassis real do veículo que será monitorado. Além disso, configure os números de telefone que receberão notificações diretamente no NodeRed, ajustando-os conforme sua necessidade.

Agora, o fluxo de automação estará configurado e pronto para uso no NodeRed, permitindo que você aproveite as funcionalidades avançadas para monitorar e controlar seu veículo GWM diretamente no Home Assistant.

## Suporte
Para dúvidas, problemas ou sugestões, abra uma issue.

## Contato
A comunidade Havaleiros está no WhatsApp. Você pode solicitar acesso enviando email para havaleiros@gmail.com ou gentefelizclube@gmail.com.

![Havaleiros Brasil](https://raw.githubusercontent.com/havaleiros/hassio-haval-h6-to-mqtt/main/haval-h6-mqtt/images/Havaleiros_logo_Quadrado.png)

## Contribuições
Contribuições são bem-vindas! Sinta-se à vontade para abrir pull requests ou issues no repositório do GitHub.

Obrigado por utilizar o add-on `GWM Brasil com MQTT` para Home Assistant. Aproveite a integração!

## Créditos

Este projeto foi possível devido ao trabalho executado em https://github.com/ipsBruno/haval-h6-gwm-alexa-chatgpt-mqtt-integration, que por sua vez utilizou o trabalho disponível em https://github.com/zivillian/ora2mqtt.

Contribuições de: 
- @carvalr
- @paulovitin
- @bobaoapae
- @rodrigogbs

## Licença
Licença MIT

Copyright (c) 2025 Havaleiros

É concedida permissão, gratuitamente, a qualquer pessoa que obtenha uma cópia deste software e arquivos de documentação associados (o "Software"), para lidar no Software sem restrições, incluindo, sem limitação, os direitos usar, copiar, modificar, mesclar, publicar, distribuir, sublicenciar e/ou vender cópias do Software e permitir que as pessoas a quem o Software é capacitado para fazê-lo, sujeito às seguintes condições:

O aviso de direitos autorais acima e este aviso de permissão serão incluídos em todos cópias ou partes substanciais do Software.

O SOFTWARE É FORNECIDO "COMO ESTÁ", SEM GARANTIA DE QUALQUER TIPO, EXPRESSA OU IMPLÍCITAS, INCLUINDO, MAS NÃO SE LIMITANDO ÀS GARANTIAS DE COMERCIALIZAÇÃO, ADEQUAÇÃO A UM DETERMINADO FIM E NÃO VIOLAÇÃO. EM HIPÓTESE ALGUMA O OS AUTORES OU DETENTORES DE DIREITOS AUTORAIS SERÃO RESPONSÁVEIS POR QUALQUER RECLAMAÇÃO, DANOS OU OUTROS RESPONSABILIDADE, SEJA EM UMA AÇÃO DE CONTRATO, ATO ILÍCITO OU DE OUTRA FORMA, DECORRENTE DE, FORA DE OU EM CONEXÃO COM O SOFTWARE OU O USO OU OUTRAS NEGOCIAÇÕES NO PROGRAMAS.