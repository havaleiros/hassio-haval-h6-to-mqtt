# Changelog

## 0.0.15
- Alteração de nome de exibição da integração para abarcar demais veículos da marca GWM.
- Atualizado arquivo `HomeAssistant_Dashboard_Haval.yaml` para corrigir a exibição do botão de acionamento do ar condicionado quando o carro está desligado.

## 0.0.14
- Adicionada caixa de seleção de veículo `select.gwmbrasil_veiculos_registrados` para usuários que possuam mais de um veículo cadastrado no aplicatiov My GWM.
- Nova versão do `HomeAssistant_Dashboard_Haval.yaml` com melhorias e agora sem a necessidade de ajustes manuais, tendo comportamento dinâmico de acordo com o veículo selecionado. _ATENÇÃO: Para a controle de comandos via relógio inteligente, ainda é necessário configurar o chassis manualmente, conforme descrito no `README.md`_.
- Atualizado `README.md` para adicionar os custom cards `config-template-card` para permitir o comportamento dinâmico do dashboard, `lovelace-collapsable-cards` para esconder o mapa e `mini-graph-card` para exibir gráficos de pressão e temperatura dos pneus.
- Alteração do prefixo de todas as entidades de, por exemplo, `sensor.haval_*` para `sensor.gwmbrasil_*`. _Todas as entidades antigas serão removidas e os históricos serão perdidos_.
- Alteração do sensor `Autonomia HEV` para `Autonomia EV`. Se utiliza um dashboard personalizado, atualize o nome do sensor.
- Alterações nos sensores para permitir o uso em coleta de estatísticas.
- Melhorias e correções de bugs.

## 0.0.13
- Adicionado sensor para indicar se o carro está ligado ou desligado: `sensor.haval_*_estado_do_motor`
- Atualizado o arquivo `README.md` com instruções de configuração revisadas.
- Alteração na execução de comandos.
- Tratamento de exceções que poderiam causar a finalização abrupta do add-on em caso de erro de leitura aos dados do veículo.
- Modificado o painel lovelace para adicionar a opção de acionamento temporário do ar-condicionado. Disponível somente quando o veículo está desligado, trancado e o ar-condicionado desligado.
- Ajuste na exibição das imagens de status do veículo para remover bordas e fundo.

## 0.0.12
- Atualizado o arquivo `README.md` para adicionar custom cards.
- Adicionada opção de acionar o ar condicionado por 15 minutos, em 18 graus.
- Modificado o painel lovelace para acionar opção de reduzir a visualização das entidades nos cards.
- Remoção do log por clico para evitar overflow.
- Parâmetro de configuração alterado de [`refresh_minutes`] para [`refresh_time`], agora com configuração em segundos ao invés de minutos. Mínimo de 5 segundos.
- Adicionado botão para acionamento temporário do ar condicionado para ser utilizado em relógios inteligentes. *Veja o `README.md` para mais informações*.

## 0.0.11
- Ajuste nos códigos das portas que estavam invertidos.
- Remove as entidades antes de registrá-las para garantir que o tópico de estado estará correto.
- Tradução do arquivo `CHANGELOG.md`.

## 0.0.10
- Substituição dos sensores por `binary_sensors` para portas e renomeação deles.
- *Alerta*: Renomear sensores fará com que alguns sensores anteriores fiquem indisponíveis, e quaisquer dashboards personalizados devem ser atualizados.
- Novo Dashboard para Home Assistant. *Veja o `README.md` para mais informações*.
- Adição de ícones para sensores sem `device_class` e `binary_sensors`.
- Entidades são criadas apenas se o valor relacionado existir na resposta da API.
- Adição de uma opção de configuração para desativar o `device_tracker`.
- Removidas as configurações para unidade de pressão e caminho de dados.

## 0.0.9
- Correção de bug: Corrigir valor numérico não tratado da API ao criar atributos do device tracker.
- Correções no arquivo `map.js`.

## 0.0.8
- Atributos relacionados a ar-condicionado, portas e posição das janelas movidos de atributos do device tracker para sensores independentes.
- `README.md` atualizado para adicionar a informação sobre a configuração oculta de senha MQTT.

## 0.0.7
- Adicionada entidade `device_tracker` e atributos.
- Modificado o arquivo `map.js` para segregar sensores, atributos e itens não utilizados.
- Adicionados os métodos [`sendMqtt`], [`registerDeviceTracker`] e [`sendDeviceTrackerUpdate`] ao `mqtt.js`.
- Atualizado o `index.js` para atualizar informações relacionadas ao `device_tracker` e seus atributos.

## 0.0.6
- Versão inicial consolidada por @paulovitin