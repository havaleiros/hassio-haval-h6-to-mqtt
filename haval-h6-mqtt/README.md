# Home Assistant Community Add-on: GWM Brasil com MQTT

## Sobre

Este add-on permite a integração do Home Assistant com os veículos da **GWM Brasil** utilizando MQTT. Com essa integração, é possível monitorar e controlar várias funcionalidades do veículo diretamente pelo Home Assistant.
Você precisa ter uma instância do Home Assistant com o add-on `Mosquitto Broker` instalado e configurado. Caso esteja instalando o `Mosquitto Broker` somente para esta integração, lembre-se de reiniciar sua instância do Home Assistant após a instalação.

[![Add Add-on to Home Assistant](https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg)](https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https%3A%2F%2Fgithub.com%2Fhavaleiros%2Fhassio-haval-h6-to-mqtt)

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
gmw_username: conta_de_email_vinculada_ao_app_MyGWM
gmw_password: senha_do_app_MyGWM
gmw_vin: CHASSIS_DO_CARRO_PRINCIPAL_COM_LETRAS_MAIÚSCULAS
gmw_pin: senha_de_ativação_de_comandos_no_app_MyGWM
mqtt_server: mqtt://homeassistant.local:1883
mqtt_user: nome_de_usuario_do_mqtt
mqtt_pass: senha_do_mqtt
refresh_time: tempo_em_segundos (mínimo de 5 segundos)
device_tracker_enabled: true [ou] false
```

![Ajustes dos add-on](https://raw.githubusercontent.com/havaleiros/hassio-haval-h6-to-mqtt/main/haval-h6-mqtt/images/addon_settings.png)

Nota: Caso o campo `mqtt_pass` não esteja disponível na tela, ative a opção _Mostrar opções de configuração opcionais não utilizadas_.

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

- Acessar sua instalação do Home Assistant e recarregar a integração MQTT para que as entidades sejam corretamente lidas pelo sistema
- Caso alguma entidade apresente status indisponível, dê um restart no container `hassio-haval-h6-to-mqtt`

### Configurar um novo Dashboard em seu Home Assistant

Utilizar um novo dashboard evita a edição e impactos em dashboards existentes.

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

Para uma melhor experiência visual, é necessário instalar alguns custom cards através do HACS (Home Assistant Community Store). Siga o [guia de instalação do HACS](https://hacs.xyz/docs/setup/download) para configurá-lo no seu Home Assistant.

Os seguintes custom cards são necessários:

- [stack-in-card](https://github.com/custom-cards/stack-in-card)
- [button-card](https://github.com/custom-cards/button-card)
- [mushroom-title-card](https://github.com/piitaya/lovelace-mushroom)
- [template-entity-row](https://github.com/thomasloven/lovelace-template-entity-row)
- [card-mod](https://github.com/thomasloven/lovelace-card-mod)
- [bar-card](https://github.com/custom-cards/bar-card)
- [fold-entity-row](https://github.com/thomasloven/lovelace-fold-entity-row)
- [config-template-card](https://github.com/iantrich/config-template-card)
- [lovelace-collapsable-cards](https://github.com/RossMcMillan92/lovelace-collapsable-cards)
- [mini-graph-card](https://github.com/kalkih/mini-graph-card)

Depois de instalar o HACS, siga as instruções específicas de cada card para adicioná-los ao seu dashboard.

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

Nota: Caso a pressão dos pneus seja exibida com a unidade de medida `kPa`, toque sobre cada entidade na lista Pneus - do lado direito do dashboard - e toque no ícone de engrenagem, _Configurações_. Altere a unidade de medida para `psi`.

![Exemplo de painel no Home Assistant](https://raw.githubusercontent.com/havaleiros/hassio-haval-h6-to-mqtt/main/haval-h6-mqtt/images/HomeAssistant_Example.png)

### Configuração do controle do ar condicionado via Smart Watch no Home Assistant Companion

A configuração para smart watch funciona tanto para Android, quanto para iOS. No entanto, este guia aborda somente a configuração para iOS. Verifique a documentação do Home Assistant para a configuração para dispositivos Android.

#### Adicionando "ios" e "AC Haval" no `configuration.yaml`

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
        text: "AC Haval"
        color: "#FFFFFF"
      icon:
        icon: mdi:car-estate
        color: "#FFFFFF"
```

2. **Configurando o "AC Haval":**
Para integrar o controle do ar-condicionado do seu Haval H6, certifique-se de seguir as instruções de instalação deste repositório, e então adicione a automação ou entidade correspondente ao ar-condicionado no seu Home Assistant. Um exemplo de configuração do "AC Haval" pode ser feito com base nas informações que o MQTT está expondo no seu servidor.
Substitua `{chassis}` pelo código de chassis de seu veículo, sempre com letras minúsculas. Remova também as chaves ({}) na substituição.

Exemplo de automação para controle do AC usando um botão:
```yaml
automation:
  - alias: "Acionamento temporário do AC do Haval"
    initial_state: false
    trigger:
      - platform: event
        event_type: ios.action_fired
        event_data:
          actionName: "AC Haval"
    action:
      - action: button.press
        entity_id: button.gwmbrasil_{chassis}_ativacao_do_ar_condicionado
```

![Botão no Apple Watch](https://raw.githubusercontent.com/havaleiros/hassio-haval-h6-to-mqtt/main/haval-h6-mqtt/images/HA_Companion_watchOS.png)

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