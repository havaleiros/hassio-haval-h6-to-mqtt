# Changelog

## [0.0.19] - 2025-04-10

## Adicionado
- Novo atributo para o device tracker `Potência do sinal de rede móvel`.

### Consertado
- Corrigida a chamada para listagem de veículos na conta vinculada.

## [0.0.18] - 2025-03-17

### Adicionado
- Autonomia total para veículos PHEV no dashboard, somando a autonomia EV e a autonomia à combustão.

### Consertado
- Atualizado arquivo `HomeAssistant_Dashboard_Haval.yaml` para exibir somente as entidades de acordo com o modelo do veículo (HEV, PHEV, BEV).

### Modificado
- Entidades são criadas por padrão, mesmo quando não utilizadas por um veículo, revertendo o que havia sido implementado na release `0.0.10`. Motivo: compatibilidade entre tipos de veículos para correta exibição do dashboard.
- Adicionada a instrução no `README.md` para utilizar a versão `1.3.7-beta.1` do `config-template-card`.

## [0.0.17] - 2025-03-16

### Adicionado
- ⚡Novo botão que ao ser acionado, gera um agendamento de carregamento para os próximos 5 minutos, de forma a liberar o bocal de carregamento para modelos Haval H6 PHEV34 e Haval H6 GT que após a atualização de software do OBC (_Onboard Charger_) para ativação do V2L não podem mais liberar o bocal de carregamento para retirada do plug do wallbox ou carregador DC antes da carga em 100% da bateria. Esta é uma solução paliativa tendo em vista que a GWM não provê outra forma que não o agendamento da recarga no veículo, no aplicativo ou utilizar o mecanismo de emergência, a corda na caixa de roda. Relacionado ao post no app [My GWM](https://shorturl.at/fvxoq).

### Consertado
- Funcionamento do botão de acionamento do ar condicionado. Após release `0.0.14` ocorria falha no acionamento por falta do número de chassis a ser utilizado.

### Modificado
- Parâmetro de configuração `MQTT_USER` é agora opcional.
- Atualizado arquivo `HomeAssistant_Dashboard_Haval.yaml` para adicionar o botão `button.gwmbrasil_{chassis}_interromper_carregamento` quando o estado da carga for _Carregando_.

## [0.0.16] - 2025-03-12

### Adicionado
- Adicionado passo de inicialização do add-on para remover entidades obsoletas, anteriormente executado antes do registro de cada entidade, o que gerava o efeito colateral de não remover entidades previamente criadas e que não sejam mais reportadas na API.

### Consertado
- Atualizado o arquivo `README.md` com o nome correto das configurações.

### Modificado
- 🚨⚠ BREAKING CHANGE: Alteradas as variáveis de configuração de `haval_*` para `gwm_*`. _ATENÇÃO: será necessário atualizar as variáveis de configuração antes de iniciar o add-on._
- Atualizado arquivo `HomeAssistant_Dashboard_Haval.yaml` para atualização automática do dashboard após mudança de valores das entidades. Dashboard somente exibirá entidades que existirem, omitindo entidades específicas dos modelos PHEV quando um veículo HEV estiver selecionado.

## [0.0.15] - 2025-03-10

### Adicionado
- Tradução em `en` e `pt-BR` para as configurações do add-on no Home Assistant.

### Modificado
- Alteração de nome de exibição da integração para abarcar demais veículos da marca GWM.
- Atualizado arquivo `HomeAssistant_Dashboard_Haval.yaml` para corrigir a exibição do botão de acionamento do ar condicionado quando o carro está desligado.

### Segurança
- Atualizada a versão do Axios.

## [0.0.14] - 2025-03-07

### Adicionado
- Alterações nos sensores para permitir o uso em coleta de estatísticas.
- Adicionada caixa de seleção de veículo `select.gwmbrasil_veiculos_registrados` para usuários que possuam mais de um veículo cadastrado no aplicativo My GWM.

### Modificado
- Nova versão do `HomeAssistant_Dashboard_Haval.yaml` com melhorias e agora sem a necessidade de ajustes manuais, tendo comportamento dinâmico de acordo com o veículo selecionado. _ATENÇÃO: Para a controle de comandos via relógio inteligente, ainda é necessário configurar o chassis manualmente, conforme descrito no `README.md`_.
- Atualizado `README.md` para adicionar os custom cards `config-template-card` para permitir o comportamento dinâmico do dashboard, `lovelace-collapsable-cards` para esconder o mapa e `mini-graph-card` para exibir gráficos de pressão e temperatura dos pneus.
- Alteração do prefixo de todas as entidades de, por exemplo, `sensor.haval_*` para `sensor.gwmbrasil_*`. _Todas as entidades antigas serão removidas e os históricos serão perdidos_.
- Alteração do sensor `Autonomia HEV` para `Autonomia EV`. Se utiliza um dashboard personalizado, atualize o nome do sensor.

### Consertado
- Melhorias e correções de bugs.

## [0.0.13] - 2024-11-27
- Adicionado sensor para indicar se o carro está ligado ou desligado: `sensor.gwmbrasil_*_estado_do_motor`
- Atualizado o arquivo `README.md` com instruções de configuração revisadas.
- Alteração na execução de comandos.
- Tratamento de exceções que poderiam causar a finalização abrupta do add-on em caso de erro de leitura aos dados do veículo.
- Modificado o painel lovelace para adicionar a opção de acionamento temporário do ar-condicionado. Disponível somente quando o veículo está desligado, trancado e o ar-condicionado desligado.
- Ajuste na exibição das imagens de status do veículo para remover bordas e fundo.

## [0.0.12] - 2024-09-26
- Atualizado o arquivo `README.md` para adicionar custom cards.
- Adicionada opção de acionar o ar condicionado por 15 minutos, em 18 graus.
- Modificado o painel lovelace para adicionar opção de reduzir a visualização das entidades nos cards.
- Remoção do log por ciclo para evitar overflow.
- Parâmetro de configuração alterado de [`refresh_minutes`] para [`refresh_time`], agora com configuração em segundos ao invés de minutos. Mínimo de 5 segundos.
- Adicionado botão para acionamento temporário do ar condicionado para ser utilizado em relógios inteligentes. *Veja o `README.md` para mais informações*.

## [0.0.11] - 2024-06-16
- Ajuste nos códigos das portas que estavam invertidos.
- Remove as entidades antes de registrá-las para garantir que o tópico de estado estará correto.
- Tradução do arquivo `CHANGELOG.md`.

## [0.0.10] - 2024-06-14
- Substituição dos sensores por `binary_sensors` para portas e renomeação deles.
- *Alerta*: Renomear sensores fará com que alguns sensores anteriores fiquem indisponíveis, e quaisquer dashboards personalizados devem ser atualizados.
- Novo Dashboard para Home Assistant. *Veja o `README.md` para mais informações*.
- Adição de ícones para sensores sem `device_class` e `binary_sensors`.
- Entidades são criadas apenas se o valor relacionado existir na resposta da API.
- Adição de uma opção de configuração para desativar o `device_tracker`.
- Removidas as configurações para unidade de pressão e caminho de dados.

## [0.0.9] - 2024-06-11
- Correção de bug: Corrigir valor numérico não tratado da API ao criar atributos do device tracker.
- Correções no arquivo `map.js`.

## [0.0.8] - 2024-06-10
- Atributos relacionados a ar-condicionado, portas e posição das janelas movidos de atributos do device tracker para sensores independentes.
- `README.md` atualizado para adicionar a informação sobre a configuração oculta de senha MQTT.

## [0.0.7] - 2024-06-10
- Adicionada entidade `device_tracker` e atributos.
- Modificado o arquivo `map.js` para segregar sensores, atributos e itens não utilizados.
- Adicionados os métodos [`sendMqtt`], [`registerDeviceTracker`] e [`sendDeviceTrackerUpdate`] ao `mqtt.js`.
- Atualizado o `index.js` para atualizar informações relacionadas ao `device_tracker` e seus atributos.

## [0.0.6] - 2024-06-03
- Versão inicial consolidada por @paulovitin