# Home Assistant Community Add-on: GWM Brasil Haval H6 com MQTT

## Sobre

Este add-on permite a integração do Home Assistant com o veículo GWM **Brasil** Haval H6 utilizando MQTT. Com essa integração, é possível monitorar e controlar várias funcionalidades do veículo diretamente pelo Home Assistant.

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
2. Selecione o add-on **GWM Brasil Haval H6 com MQTT**.
3. Clique em **Instalar** e aguarde a conclusão da instalação.

#### 3. Configurando o Add-on

1. Após a instalação, vá até a aba **Ajustes** do add-on.
2. Configure os parâmetros necessários como endereço do broker MQTT, credenciais, e outras opções específicas para o Haval H6.
```yaml
haval_username: conta_de_email_vinculada_ao_app_MyGWM
haval_password: senha_do_app_MyGWM
haval_vin: CHASSIS_DO_CARRO
haval_pin: senha_de_ativação_de_comandos_no_app_MyGWM
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
Volte para a aba Informação do add-on.
Clique em Iniciar para inicializar o add-on.
Habilite a opção Iniciar na Inicialização se desejar que o add-on inicie automaticamente junto com o Home Assistant.
5. Verificando a Integração
Vá para Configuração no menu lateral do Home Assistant.
Selecione Ferramentas de desenvolvedor.
Verifique se as entidades iniciadas com *sensor.haval_* estão listados na aba Estado.
Agora, você deve ser capaz de monitorar o seu veículo diretamente pelo painel do Home Assistant.

### Adicionando um Novo Dashboard no Home Assistant

#### Passo a Passo

1. Acesse a interface web do Home Assistant.
2. Navegue até **Configurações** no menu lateral.
3. Selecione **Dashboards**.
4. Clique em **Adicionar Dashboard**.
5. Atribua o título como `haval` e o ícone como `mdi:car-electric`. Ative a opção `Mostrar na barra lateral` e clique em _CRIAR_.
6. Na nova linha criada com o novo dashboard, clique em _ABRIR_.
7. No canto superior esquerdo da tela, clique em _Editar dashboard_.
8. Clique novamente no símbolo com 3 pontos verticais e depois em _Editor de configuração RAW_.
9. Apague o conteúdo existente que será exibido, copie o conteúdo do arquivo `HomeAssistant_Dashboard_Haval.yaml` fornecido como template e cole nesta tela. [Baixe aqui o arquivo YAML](https://github.com/havaleiros/hassio-haval-h6-to-mqtt/blob/main/haval-h6-mqtt/files/HomeAssistant_Dashboard_Haval.yaml).
10. Substitua todas as ocorrências de {chassis} pelo código de chassis de seu veículo.

#### Adicionando Imagens do Veículo

1. Baixe o arquivo [Baixe aqui o arquivo haval_h6.zip](https://github.com/havaleiros/hassio-haval-h6-to-mqtt/raw/main/haval-h6-mqtt/files/haval_h6.zip).
2. Descompacte o arquivo e salve as imagens na pasta `www/images/haval_h6` do Home Assistant.

O resultado esperado é que as imagens devem ficar no caminho `www/images/haval_h6/[imagem].png`
Não salve o arquivo `haval_h6.zip` diretamente no diretório do Home Assistant, pois isto não terá efeito no uso das imagens. 

#### Dica
Recomenda-se o uso do Add-on [Samba share](https://github.com/home-assistant/addons/tree/master/samba) para acesso na pasta `www` de sua instância do Home Assistant.
Desta forma não haverá necessidde de copiar imagem por imagem para a pasta.

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

Depois de instalar o HACS, siga as instruções específicas de cada card para adicioná-los ao seu dashboard.


Agora, seu novo dashboard estará configurado para exibir informações detalhadas sobre o seu veículo GWM Haval H6.

![Exemplo de painel no Home Assistant](https://raw.githubusercontent.com/havaleiros/hassio-haval-h6-to-mqtt/main/haval-h6-mqtt/images/HomeAssistant_Example.png)

####

### Configuração do Home Assistant

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
        entity_id: button.switch.haval_{chassis}_ativacao_do_ar_condicionado
```
## Suporte
Para dúvidas, problemas ou sugestões, abra uma issue.

## Contato
A comunidade Havaleiros está no WhatsApp. Você pode solicitar acesso enviando email para havaleiros@gmail.com ou gentefelizclube@gmail.com.

![Havaleiros Brasil](https://raw.githubusercontent.com/havaleiros/hassio-haval-h6-to-mqtt/main/haval-h6-mqtt/images/Havaleiros_logo_Quadrado.png)

## Contribuições
Contribuições são bem-vindas! Sinta-se à vontade para abrir pull requests ou issues no repositório do GitHub.

Obrigado por utilizar o add-on GWM Brasil Haval H6 com MQTT para Home Assistant. Aproveite a integração!

## Créditos

Este projeto foi possível devido ao trabalho executado em https://github.com/ipsBruno/haval-h6-gwm-alexa-chatgpt-mqtt-integration, que por sua vez utilizou o trabalho disponível em https://github.com/zivillian/ora2mqtt.

Contribuições de: 
- @paulovitin
- @bobaoapae
- @carvalr

## Licença
Licença MIT

Copyright (c) 2024 Havaleiros

É concedida permissão, gratuitamente, a qualquer pessoa que obtenha uma cópia deste software e arquivos de documentação associados (o "Software"), para lidar no Software sem restrições, incluindo, sem limitação, os direitos usar, copiar, modificar, mesclar, publicar, distribuir, sublicenciar e/ou vender cópias do Software e permitir que as pessoas a quem o Software é capacitado para fazê-lo, sujeito às seguintes condições:

O aviso de direitos autorais acima e este aviso de permissão serão incluídos em todos cópias ou partes substanciais do Software.

O SOFTWARE É FORNECIDO "COMO ESTÁ", SEM GARANTIA DE QUALQUER TIPO, EXPRESSA OU IMPLÍCITAS, INCLUINDO, MAS NÃO SE LIMITANDO ÀS GARANTIAS DE COMERCIALIZAÇÃO, ADEQUAÇÃO A UM DETERMINADO FIM E NÃO VIOLAÇÃO. EM HIPÓTESE ALGUMA O OS AUTORES OU DETENTORES DE DIREITOS AUTORAIS SERÃO RESPONSÁVEIS POR QUALQUER RECLAMAÇÃO, DANOS OU OUTROS RESPONSABILIDADE, SEJA EM UMA AÇÃO DE CONTRATO, ATO ILÍCITO OU DE OUTRA FORMA, DECORRENTE DE, FORA DE OU EM CONEXÃO COM O SOFTWARE OU O USO OU OUTRAS NEGOCIAÇÕES NO PROGRAMAS.