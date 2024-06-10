# Home Assistant Community Add-on: GWM Brasil Haval H6 com MQTT

## Sobre

Este add-on permite a integração do Home Assistant com o veículo GWM **Brasil** Haval H6 utilizando MQTT. Com essa integração, é possível monitorar e controlar várias funcionalidades do veículo diretamente pelo Home Assistant.

### Passo a Passo para adicionar o add-on ao Home Assistant

#### 1. Adicionando o Repositório do Add-on

1. Acesse a interface web do Home Assistant.
2. Navegue até **Supervisor** no menu lateral.
3. Selecione a aba **Add-on Store**.
4. Clique nos três pontos no canto superior direito e selecione **Repositórios**.
5. Adicione o URL do repositório do add-on:
https://github.com/havaleiros/hassio-haval-h6-to-mqtt
6. Clique em **Adicionar** e, em seguida, feche a janela de repositórios.

#### 2. Instalando o Add-on

1. Na aba **Add-on Store**, role para baixo até encontrar o repositório que você acabou de adicionar.
2. Selecione o add-on **GWM Brasil Haval H6 com MQTT**.
3. Clique em **Instalar** e aguarde a conclusão da instalação.

#### 3. Configurando o Add-on

1. Após a instalação, vá até a aba **Ajustes** do add-on.
2. Configure os parâmetros necessários como endereço do broker MQTT, credenciais, e outras opções específicas para o Haval H6.
```yaml
data_path: /config/haval_h6_mqtt
haval_username: conta_de_email_vinculada_ao_myGWM
haval_password: senha_do_myGWM
haval_vin: CHASSIS_DO_CARRO
mqtt_server: mqtt://homeassistant.local:1883
mqtt_user: nome_de_usuario_do_mqtt
mqtt_pass: senha_do_mqtt
refresh_minutes: 5
pressure_unit: kPa [ou] psi
```

![Ajustes dos add-on](https://raw.githubusercontent.com/carvalr/hassio-haval-h6-to-mqtt/main/haval-h6-mqtt/images/addon_settings.png)

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

[YAML de painel no Home Assistant](https://github.com/carvalr/hassio-haval-h6-to-mqtt/blob/main/haval-h6-mqtt/lovelace/HomeAssistant_Lovelace.yaml)
![Exemplo de painel no Home Assistant](https://raw.githubusercontent.com/carvalr/hassio-haval-h6-to-mqtt/main/haval-h6-mqtt/images/HomeAssistant_Example.png)

## Suporte
Para dúvidas, problemas ou sugestões, abra uma issue.

## Contato
A comunidade Havaleiros está no WhatsApp. Você pode solicitar acesso enviando email para havaleiros@gmail.com ou gentefelizclube@gmail.com.

![Havaleiros Brasil](https://raw.githubusercontent.com/carvalr/hassio-haval-h6-to-mqtt/main/haval-h6-mqtt/images/Havaleiros_logo_Quadrado.png)

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
