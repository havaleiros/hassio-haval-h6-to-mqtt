# Changelog

## 0.0.11
- Ajuste nos códigos das portas que estavam invertidos.
- Remove as entidades antes de registrá-las para garantir que o tópico de estado estará correto.
- Tradução do arquivo changelog.

## 0.0.10
- Substituição dos sensores por binary_sensors para portas e renomeação deles.
- *Alerta*: Renomear sensores fará com que alguns sensores anteriores fiquem indisponíveis, e quaisquer dashboards personalizados devem ser atualizados.
- Novo Dashboard para Home Assistant.
- *Veja o README para mais informações*.
- Adição de ícones para sensores sem device_class e binary_sensors.
- Entidades são criadas apenas se o valor relacionado existir na resposta da API.
- Adição de uma opção de configuração para desativar o device_tracker.
- Removidas as configurações para unidade de pressão e caminho de dados.

## 0.0.9
- Correção de bug: Corrigir valor numérico não tratado da API ao criar atributos do device tracker.
- Correções no arquivo map.js

## 0.0.8
- Atributos relacionados a ar-condicionado, portas e posição das janelas movidos de atributos do device tracker para sensores independentes.
- README atualizado para adicionar a informação sobre a configuração oculta de senha MQTT.

## 0.0.7
- Adicionada entidade device_tracker e atributos.
- Modificado o arquivo map.js para segregar sensores, atributos e itens não utilizados.
- Adicionados os métodos [sendMqtt], [registerDeviceTracker] e [sendDeviceTrackerUpdate] ao mqtt.js.
- Atualizado o index.js para atualizar informações relacionadas ao device_tracker e seus atributos.

## 0.0.6
- Versão inicial consolidada por @paulovitin