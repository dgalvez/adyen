const { html, Component, render } = globalThis.htmPreact;

const appRoot = document.getElementById('app');

function CurrencySelector({ className = '', currencies = [], onChange = () => { } }) {
  return html`
    <select className=${className} onChange=${onChange}>
      ${currencies.map((currency) => {
    const [code, label] = currency;
    return html`<option value="${code}">${label ?? code}</option>`;
  })}
    </select>
  `;
}

class CurrencyConverter extends Component {
  constructor(props) {
    super(props);

    this.onInputChanged = this.onInputChanged.bind(this);
    this.onConvertClicked = this.onConvertClicked.bind(this);

    this.state = {
      UIReady: false,
      loading: false,
      sourceCurrency: null,
      targetCurrency: null,
      sourceAmount: null,
      convertedAmount: null,
      currencies: [],
      backendError: null
    };
  }

  async componentDidMount() {
    const { currencies = [[]] } = await this.fetchCurrencyList();

    const [[initialCurrency]] = currencies;
    this.setState({
      UIReady: true,
      currencies,
      sourceCurrency: initialCurrency,
      targetCurrency: initialCurrency
    });
  }

  async onConvertClicked() {
    const { convertedAmount } = await this.convert({
      from: this.state.sourceCurrency,
      to: this.state.targetCurrency,
      amount: this.state.sourceAmount
    });
    this.setState({ convertedAmount });
  }

  onInputChanged(property) {
    return ({ currentTarget }) => this.setState({ [property]: currentTarget.value });
  }

  render() {
    const {
      UIReady,
      convertedAmount,
      currencies,
      backendError
    } = this.state;

    return html`

      ${UIReady ?
        html`<div className="convert-form">
          <div className="convert-form__section">
            <${CurrencySelector} className="convert-form__currency" onChange=${this.onInputChanged('sourceCurrency')} currencies="${currencies}" key="from-selector" />
            <${CurrencySelector} className="convert-form__currency" onChange=${this.onInputChanged('targetCurrency')} currencies="${currencies}" key="to-selector" />
          </div>
          <div className="convert-form__section">
            <label>
              <input className="convert-form__amount" type="number" onChange=${this.onInputChanged('sourceAmount')} key="amount-input" />
              <span>Amount</span>
            </label>
          </div>
          <div className="convert-form__section">
            <button className="convert-form__submit" onClick=${this.onConvertClicked}>Convert</button>
          </div>
          <div className="convert-form__section">
            ${!!convertedAmount && html`<span className="convert-form__converted-amount">${convertedAmount}</span>`}
            ${!!backendError && html`<span className="convert-form__error-message">${backendError}</span>`}
          </div>
        </div>` :
        html`<div className="loader">
              <div className="loader-line"></div>
              <div className="loader-line"></div>
        </div>`
      }
      
    `;
  }

  async fetchCurrencyList() {
    return await this.get('/currencies');
  }

  async convert({ from, to, amount }) {
    this.setState({ convertedAmount: null });
    return await this.get(`/convert?${new URLSearchParams({ from, to, amount }).toString()}`);
  }

  get(...params) {
    return new Promise((resolve, reject) => {
      this.setState({ loading: true, backendError: null });
      fetch(...params)
        .then(async (response) => {
          this.setState({ loading: false });
          if (!response.ok) {
            const { message } = await response.json() ?? {};
            throw Error(message ?? response.statusText);
          }
          return response;
        })
        .then((response) => resolve(response.json()))
        .catch(({ message }) => {
          this.setState({ backendError: message });
          resolve({});
        })
    });
  }

}

render(
  html`<${CurrencyConverter} />`,
  appRoot
);