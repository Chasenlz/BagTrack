import { IpcMessageEvent, ipcRenderer  } from 'electron';
import * as React from 'react';
import Modal from 'react-responsive-modal';

import { SaleInfo, Settings } from '@/common/types';
import CyberLogo from '@public/img/cyber.svg';
import * as GoatLogo from '@public/img/goat.png';
import * as StockxLogo from '@public/img/stockx.png';
import '@public/scss/home.scss';
import { AddSale } from '../components/addSale';
import { TableItem } from '../components/tableItem';

type AnalyticStore = {
  grossProfit: number;
  netProfit: number;
  topCategory: string;
  mostProfitableProduct: string;
}
type HomeProps = {};
type HomeState = {
  sales: SaleInfo[];
  addModalOpen: boolean;
  goatConnected: boolean;
  stockxConnected: boolean;
  cyberConnected: boolean;
};

let storedSales: SaleInfo[] = [];
let storedAnalytics: AnalyticStore = {
  grossProfit: 0,
  netProfit: 0,
  topCategory: 'None',
  mostProfitableProduct: 'None'
};

/**
 * Home component to be used as main homepage
 */
export class Home extends React.Component<HomeProps, HomeState> {
  private grossProfit: number;
  private netProfit: number;
  private topCategory: string;
  private mostProfitableProduct: string;
  constructor(props: HomeProps) {
    super(props);
    this.state = {
      sales: [],
      addModalOpen: false,
      goatConnected: false,
      stockxConnected: false,
      cyberConnected: false,
    };

    this.grossProfit = 0;
    this.netProfit = 0;
    this.topCategory = 'None';
    this.mostProfitableProduct = 'None';

    this.openAddModal = this.openAddModal.bind(this);
    this.closeAddModal = this.closeAddModal.bind(this);
    this.syncGoat = this.syncGoat.bind(this);
    this.syncStockx = this.syncStockx.bind(this);
    this.syncCyber = this.syncCyber.bind(this);

    ipcRenderer.on('getSales', (event: IpcMessageEvent, sales: SaleInfo[]): void => {
      /* Reset analytics to prepare for new data */
      this.grossProfit = 0;
      this.netProfit = 0;
      this.topCategory = 'None';
      this.mostProfitableProduct = 'None';

      // tslint:disable: no-for-in-array
      // tslint:disable: no-for-in
      // tslint:disable: forin
      // tslint:disable: restrict-plus-operands
      const categoryStore: any = sales.map((sale: SaleInfo) => sale.category);
      const frequency: any = {};
      let max: number = 0;
      for (const v in categoryStore) {
        frequency[categoryStore[v]] = (frequency[categoryStore[v]] || 0) + 1;
        if (frequency[categoryStore[v]] > max) {
          max = frequency[categoryStore[v]];
          this.topCategory = categoryStore[v];
          storedAnalytics.topCategory = categoryStore[v];
        }
      }

      let mostProfitable: number = 0;
      for (const sale of sales) {
        this.netProfit += sale.netProfit;
        this.grossProfit += sale.grossProfit;
        if (sale.netProfit > mostProfitable) {
          this.mostProfitableProduct = sale.product;
          mostProfitable = sale.netProfit;
        }
      }
      storedAnalytics.grossProfit = this.grossProfit;
      storedAnalytics.netProfit = this.netProfit;
      storedAnalytics.topCategory = this.topCategory;
      storedAnalytics.mostProfitableProduct = this.mostProfitableProduct;
      storedSales = sales;
      this.setState({ sales });
    });
  }

  public componentDidMount(): void {
    this.grossProfit = storedAnalytics.grossProfit;
    this.netProfit = storedAnalytics.netProfit;
    this.topCategory = storedAnalytics.topCategory;
    this.mostProfitableProduct = storedAnalytics.mostProfitableProduct;
    this.setState({ sales: storedSales });
    ipcRenderer.send('requestSettings');
    ipcRenderer.on('loadSettings', (event: IpcMessageEvent, settings: Settings) => {
      if (settings.goatAuthToken) {
        this.setState({ goatConnected: true });
      }
      if (settings.stockxJwtToken) {
        this.setState({ stockxConnected: true });
      }
      if (settings.cyberCookie) {
        this.setState({ cyberConnected: true });
      }
    });
  }

  public componentWillUnmount(): void {
    ipcRenderer.removeAllListeners('loadSettings');
  }

  public render(): React.ReactNode {
    const { sales } = this.state;
    let tableSales: React.ReactElement | React.ReactElement[];

    if (sales && sales.length > 0) {
      tableSales = (
        <tbody className='table-body'>
          { sales.map((sale: SaleInfo, index: number) => {
            return (
              <TableItem sale={sale} key={index} index={index} />
            );
          })}
        </tbody>
      );
    } else {
      tableSales = (
        <div className='no-sales-found'>
          <div>
            🤘😔 No sales found
          </div>
          <button onClick={this.openAddModal} className='ml-auto add-button'>
            Add Sale
          </button>
        </div>
      );
    }

    return (
      <div className='home'>
        <div className='container'>
          <div className='title-container'>
            <div className='title'>
              Analytic Overview
            </div>
            <button onClick={this.openAddModal} className='ml-auto add-button'>
              Add Sale
            </button>
          </div>
          <div className='summary-cards'>
            <div className='summary-card gross-profit-loss'>
              <div className='title'>
                <p>
                  Gross Income
                </p>
              </div>
              <div className='content'>
                <p>
                  ${this.grossProfit}
                </p>
              </div>
            </div>
            <div className='summary-card net-profit-loss'>
              <div className='title'>
                <p>
                  Net Income
                </p>
              </div>
              <div className='content'>
                <p>
                  ${this.netProfit}
                </p>
              </div>
            </div>
            <div className='summary-card top-category'>
              <div className='title'>
                <p>
                  Top Category
                </p>
              </div>
              <div className='content'>
                <p>
                  {this.topCategory}
                </p>
              </div>
            </div>
            <div className='summary-card top-product'>
              <div className='title'>
                <p>
                  Top Product Sold
                </p>
              </div>
              <div className='content'>
                <p>
                  {this.mostProfitableProduct}
                </p>
              </div>
            </div>
          </div>
          <div className='sales-table-container'>
            <div className='title'>
              All Sales
              <div className='divider' />
              <div className='total'>
                {this.state.sales.length} {this.state.sales.length === 1 ? 'Sale' : 'Sales'}
              </div>
              <div className='sync-container'>
                {this.state.stockxConnected ? (
                  <button onClick={this.syncStockx} className='stockx-btn'>
                    Pull Sales <img className='img' src={StockxLogo.toString()}/>
                  </button>
                ) : null }
                {this.state.goatConnected ? (
                  <button onClick={this.syncGoat} className='goat-btn'>
                    Pull Sales <img className='img' src={GoatLogo.toString()}/>
                  </button>
                ) : null }
                {this.state.cyberConnected ? (
                  <button onClick={this.syncCyber} className='cyber-btn'>
                    Pull Sales <CyberLogo className='img' />
                  </button>
                ) : null }
              </div>
            </div>
            <table className='sales-table'>
              <thead className='table-head'>
                <tr className='row'>
                  <td>
                    <div className='cell'>
                      <span>
                        Product
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className='cell'>
                      <span>
                        Purchase Date
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className='cell'>
                      <span>
                        Purchase Price
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className='cell'>
                      <span>
                        Sell Price
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className='cell'>
                      <span>
                        Profit
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className='cell'>
                      <span></span>
                    </div>
                  </td>
                </tr>
              </thead>
              {tableSales}
            </table>
          </div>
        </div>

        <Modal
          open={this.state.addModalOpen}
          onClose={this.closeAddModal}
          focusTrapped={false}
          showCloseIcon={false}
          center
          classNames={{
            modal: 'configure-modal'
          }}
        >
          <AddSale closeModal={this.closeAddModal} />
        </Modal>
      </div>
    );
  }

  private openAddModal(): void {
    this.setState({ addModalOpen: true });
  }

  private closeAddModal(): void {
    this.setState({ addModalOpen: false });
  }

  private syncGoat(): void {
    ipcRenderer.send('syncGoatSales');
  }

  private syncStockx(): void {
    ipcRenderer.send('syncStockxSales');
  }

  private syncCyber(): void {
    ipcRenderer.send('syncCyberSales');
  }
}
