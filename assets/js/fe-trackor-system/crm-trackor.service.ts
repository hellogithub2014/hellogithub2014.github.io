import { Injectable } from "@angular/core";

import { PATHS } from "../constants/path.constants";
import { CrmLogger } from "./crm-logger.service";
import { LoginUtilsService } from "./login-utils.service";

/**
 * 页面浏览的类型
 *
 * @enum {number}
 */
enum TraceType {
  ENTER, // 进入页面
  LEAVE, // 离开页面
}

class Trace {
  constructor(
    public page: string,
    public enterTm: Date = new Date(),
    public leaveTm: Date = null,
    public duration: number = -1,
  ) { /**/ }
  public toString() {
    return `[page:${ this.page } , enterTm:${ this.enterTm } ,` +
      `leaveTm:${ this.leaveTm } ,duration:${ this.duration }]`;
  }
}

// tslint:disable-next-line:max-classes-per-file
@Injectable()
export class CrmTrackor {
  public static pageTraces: Trace[] = [];

  /**
   * ionViewDidEnter方法装饰器
   *
   * @author 80374787 刘斌
   * @static
   * @param {*} target
   * @param {string} propertyKey
   * @param {PropertyDescriptor} descriptor
   * @memberof CrmTrackor
   */
  public static ViewDidEnterTrackor( target: any, propertyKey: string, descriptor: PropertyDescriptor ) {
    const valueClone = descriptor.value;
    descriptor.value = function () {
      // tslint:disable-next-line:no-console
      console.log( `${ target },${ propertyKey },${ descriptor }` );
      // constructor.name 在产品模式下会被压缩混淆，暂时没有想到其他统一的办法来获取当前所在页面
      // CrmTrackor.logTrace( target.constructor.name, TraceType.ENTER );
      CrmTrackor.logTrace( CrmTrackor.getTrace( this, target.constructor ), TraceType.ENTER );
      valueClone.call( this );
    };
  }

  /**
   * ionViewDidLeave方法装饰器
   *
   * @author 80374787 刘斌
   * @static
   * @param {*} target
   * @param {string} propertyKey
   * @param {PropertyDescriptor} descriptor
   * @memberof CrmTrackor
   */
  public static ViewDidLeaveTrackor( target: any, propertyKey: string, descriptor: PropertyDescriptor ) {
    const valueClone = descriptor.value;
    descriptor.value = function () {
      // tslint:disable-next-line:no-console
      console.log( `${ target },${ propertyKey },${ descriptor }` );
      // constructor.name 在产品模式下会被压缩混淆，暂时没有想到其他统一的办法来获取当前所在页面
      // CrmTrackor.logTrace( target.constructor.name, TraceType.LEAVE );
      CrmTrackor.logTrace( CrmTrackor.getTrace( this, target.constructor ), TraceType.LEAVE );
      valueClone.call( this );
    };
  }

  /**
   * 类装饰器，拦截ionViewDidEnter钩子，但发现没有起作用，新钩子没有调用
   *
   * @author 80374787 刘斌
   * @export
   * @param {Function} constructor
   */
  // tslint:disable-next-line:ban-types
  public static ViewTrackor( constructor: Function ) {
    const viewDidEnterClone: () => any = constructor.prototype.ionViewDidEnter;
    constructor.prototype.ionViewDidEnter = function () {
      CrmTrackor.logTrace( constructor.name, TraceType.ENTER );
      viewDidEnterClone.call( this );
    };
  }

  // tslint:disable-next-line:ban-types
  private static getTrace( comp: any, constructor: Function ) {
    if ( !comp.navCtrl ) {
      return constructor.name;
    }

    const navCtrl = comp.navCtrl;
    let views = navCtrl.getViews();

    if ( !views || !views.length ) { // 如果是tab页的根页面，navCtrl为Tab实例，没有views
      views = [ ( navCtrl as any ).root || navCtrl.id ];
    } else {
      views = views.map( ( view ) => view.id );
    }

    const viewTop = views.slice( -1 )[ 0 ];
    const tmp = CrmTrackor.pageTraces.slice( -1 )[ 0 ]; // 进入第一个页面时，pageTraces还是空的
    const traceTop = ( tmp && tmp.page ) || "";
    /**
     * 当从A进入B时,先触发B的Enter，再触发A的Leave
     *   A的Leave中,views=[...,A,B]， traces=[...,A,B],需要记录A，
     *   B的Enter中,views=[...,A,B]， traces=[...,A],需要记录B
     * 当从B回到A时，先触发A的Enter，再触发B的Leave
     *   A的Enter中,views=[...,A,B]， traces=[...,A,B].需要记录A，
     *   B的Leave中,views=[...,A,B]， traces=[...,A,B,A].需要记录B
     *
     * 综上，Enter钩子中的记录和Leave钩子遵循相同的规律：
     *   viewTop === traceTop， 记录views倒数第二个元素
     *   viewTop !== traceTop， 记录views栈顶元素；
     */
    return ( viewTop === traceTop ) ? views.slice( -2 )[ 0 ] : viewTop;
  }

  /**
   * 记录路径
   *
   * @author 80374787 刘斌
   * @private
   * @static
   * @param {string} page
   * @param {TraceType} traceType
   * @memberof CrmTrackor
   */
  private static logTrace( page: string, traceType: TraceType ) {
    // tslint:disable-next-line:no-console
    console.log( `%c${ TraceType[ traceType ] } => ${ page }`, "color:green;font-size:large" );

    if ( traceType === TraceType.ENTER ) { // 进入页面
      CrmTrackor.pageTraces.push( new Trace( page ) );
    } else { // 离开页面
      const lastPage = CrmTrackor.pageTraces.slice( -2 )[ 0 ]; // 倒数第二个
      if ( lastPage ) {
        lastPage.leaveTm = new Date();
        lastPage.duration = lastPage.leaveTm.getTime() - lastPage.enterTm.getTime();
        // tslint:disable-next-line:no-console
        // console.log( CrmTrackor.pageTraces );
      }
    }

  }

  private userInfo: any;
  private userInfoStr: any;
  private trackorServerUrl: string;

  constructor(
    private loginService: LoginUtilsService,
    private logger: CrmLogger,
  ) {
    this.userInfo = this.loginService.getLoginUserInfo();
    this.userInfoStr = JSON.stringify( this.userInfo );
    this.trackorServerUrl = `/${ PATHS.TRACKOR }/trackor`;
  }

  /**
   * 记录元素点击，与 @crm-trackor.directive 配合使用
   *
   * @author 80374787 刘斌
   * @param {{ page: any, name: string, id?: string }} elementSite
   * @param {object} [options={}]
   * @memberof CrmTrackor
   */
  public trackorClick( elementSite: { page: any, name: string, id?: string }, options: object = {} ) {
    this.logger.log( `CrmTrackor.trackorClick.`, `elementSite:`, elementSite, `options`, options );
    const trackorInfoArr = [
      `elePage=${ elementSite.page }`,
      `eleName=${ elementSite.name }`,
      `eleId=${ elementSite.id || "" }`,
    ];

    Object.getOwnPropertyNames( options ).forEach( ( name ) => {
      trackorInfoArr.push( `${ name }=${ options[ name ] }` );
    } );

    this.track2Server( trackorInfoArr.join( "&" ) );
  }

  /**
   * 记录页面加载性能数据
   *
   * @author 80374787 刘斌
   * @memberof CrmTrackor
   */
  public trackorPerformance() {
    // 参考performance api，此处计算的这些时间也许不能满足业务需求，后续看需求调整。
    const timing = performance.timing;
    const readyStart = timing.fetchStart - timing.navigationStart;
    const redirectTime = timing.redirectEnd - timing.redirectStart;
    const appcacheTime = timing.domainLookupStart - timing.fetchStart;
    const unloadEventTime = timing.unloadEventEnd - timing.unloadEventStart;
    const lookupDomainTime = timing.domainLookupEnd - timing.domainLookupStart;
    const connectTime = timing.connectEnd - timing.connectStart;
    const requestTime = timing.responseEnd - timing.requestStart;
    const initDomTreeTime = timing.domInteractive - timing.responseEnd;
    const domReadyTime = timing.domComplete - timing.domInteractive;
    const loadEventTime = timing.loadEventEnd - timing.loadEventStart;
    const loadTime = timing.loadEventEnd - timing.navigationStart;
    // TODO 测试发下很多记录的时间为0
    this.logger.log( "准备新页面时间耗时: " + readyStart );
    this.logger.log( "redirect 重定向耗时: " + redirectTime );
    this.logger.log( "Appcache 耗时: " + appcacheTime );
    this.logger.log( "unload 前文档耗时: " + unloadEventTime );
    this.logger.log( "DNS 查询耗时: " + lookupDomainTime );
    this.logger.log( "TCP连接耗时: " + connectTime );
    this.logger.log( "request请求耗时: " + requestTime );
    this.logger.log( "请求完毕至DOM加载: " + initDomTreeTime );
    this.logger.log( "解析DOM树耗时: " + domReadyTime );
    this.logger.log( "load事件耗时: " + loadEventTime );
    this.logger.log( "加载时间耗时: " + loadTime );

    this.track2Server( JSON.stringify( timing ) );
  }

  public track2Server( trackorInfo: string ) {
    const param = `${ encodeURIComponent( trackorInfo ) }&userInfo=${ encodeURIComponent( this.userInfoStr ) }`;
    this.logger.log( `track2Server, param =>`, param );
    // use beacons to send log.
    // TODO: while the backend is ok, uncomment this
    // ( new Image() ).src = `${ this.trackorServerUrl }?${ param }`;
  }

}
