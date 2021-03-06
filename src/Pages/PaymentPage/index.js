import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { updateUser } from 'actions/authActions';
import { resetSession } from 'actions/sessionActions';
import Axios from 'axios';
import InputField from 'components/CustomFields/InputField';
import HeaderBoxProducts from 'components/HeaderBoxProducts';
import Navbar from 'components/Navbar';
import { FastField, Field, Form, Formik } from 'formik';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, Redirect } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  Card,
  CardBody,
  Col,
  Collapse,
  Container,
  FormGroup,
  Label,
  Modal,
  ModalBody,
  Row,
  Table,
} from 'reactstrap';
import * as Yup from 'yup';
import Paypal from './components/Paypal';
import { dataRadio } from './data';
import './style.scss';

const PaymentPage = (props) => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const currentUser = useSelector((state) => state.auth.user);
  const currentSession = useSelector((state) => state.session.session);
  const dispatch = useDispatch();

  const [state, setState] = useState({
    data: [],
    radio: 'cod',
    modal: false,
  });

  const initialValues = {
    userName: isAuthenticated ? currentUser.userName : '',
    userEmail: isAuthenticated ? currentUser.userEmail : '',
    userPhone: isAuthenticated ? currentUser.userPhone : '',
    userAddress: isAuthenticated ? currentUser.userAddress : '',
    paymentMethod: 'cod',
  };

  useEffect(() => {
    setState((newState) => ({
      ...newState,
      data: isAuthenticated
        ? currentUser.cart
        : !currentSession
        ? []
        : currentSession.length === 0
        ? []
        : currentSession.cart,
    }));
    //eslint-disable-next-line
  }, [isAuthenticated, currentSession, currentUser]);

  const validationSchema = Yup.object().shape({
    userName: Yup.string().required('Vui l??ng ??i???n h??? v?? t??n'),

    userPhone: Yup.string().required('Vui l??ng ??i???n s??? ??i???n tho???i'),

    userAddress: Yup.string().required('Vui l??ng ??i???n ?????a ch???'),
  });

  const toggleModal = () => {
    setState((newState) => ({
      ...newState,
      modal: !newState.modal,
    }));
  };

  const handleSubmit = async (values) => {
    const {
      userName,
      userEmail,
      userAddress,
      userPhone,
      paymentMethod,
    } = values;
    const data = {
      userName: userName,
      userEmail: userEmail,
      userAddress: userAddress,
      userPhone: userPhone,
      paymentMethod: paymentMethod,
      productsList: state.data,
    };

    const newOrder = await Axios.post(`/api/orders`, data);
    toggleModal();

    const dataUser = new FormData();
    dataUser.append('cart', JSON.stringify([]));
    await dataUser.append(
      'orders',
      JSON.stringify([newOrder.data, ...currentUser.orders])
    );

    dispatch(isAuthenticated ? updateUser({ dataUser }) : resetSession());
  };

  const onSuccess = async (value) => {
    const { address, email } = value;
    const data = {
      userName: address.recipient_name,
      userPhone: '1234567890',
      userAddress: `${address.line1}, ${address.city}, ${address.state}, ${address.country_code}`,
      userEmail: email,
      productsList: state.data,
      paymentMethod: 'paypal',
    };

    const newOrder = await Axios.post(`/api/orders`, data);
    toggleModal();

    const dataUser = new FormData();
    dataUser.append('cart', JSON.stringify([]));
    console.log(currentUser.orders);
    await dataUser.append(
      'orders',
      JSON.stringify([newOrder.data, ...currentUser.orders])
    );

    dispatch(isAuthenticated ? updateUser({ dataUser }) : resetSession());
  };
  return (
    <div className='paymentPage'>
      {!props.location.state && <Redirect to='/' />}
      <Navbar location={props.location} />
      <Modal isOpen={state.modal} className='paymentPage__success' centered>
        <ModalBody>
          <FontAwesomeIcon icon={faCheckCircle} />
          <h4>?????t h??ng th??nh c??ng</h4>
          <div className='paymentPage__success-redirect'>
            <Link className='btn btn--primary' to='/products'>
              Ti???p t???c mua h??ng
            </Link>
            {isAuthenticated && (
              <Link className='btn btn--secondary' to='/'>
                Danh s??ch ????n h??ng
              </Link>
            )}
          </div>
        </ModalBody>
      </Modal>
      <Container>
        <Breadcrumb>
          <BreadcrumbItem>
            <Link to='/'>Trang ch???</Link>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <Link to='/cart'>Gi??? h??ng</Link>
          </BreadcrumbItem>
          <BreadcrumbItem active>Thanh to??n</BreadcrumbItem>
        </Breadcrumb>
        <HeaderBoxProducts
          dataHeaderBoxProducts={[{ title: 'Thanh to??n', data: '' }]}
        />
        <Row className='paymentPage__main'>
          <Col md='5' className='paymentPage__main-left'>
            <div className='paymentPage__main-title'>
              <span>1</span>
              ????n h??ng c???a b???n
            </div>
            <Table className='paymentPage__main-table'>
              <thead>
                <tr>
                  <th style={{ width: '70%' }}>S???n ph???m</th>
                  <th style={{ width: '30%' }}>Th??nh ti???n</th>
                </tr>
              </thead>
              <tbody>
                {state.data.map((item, index) => {
                  return (
                    <tr key={index}>
                      <td>
                        {item.name}
                        <span>{` x ${item.quantity}`}</span>
                      </td>
                      <td>
                        {(item.price * item.quantity).toLocaleString('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                        })}
                      </td>
                    </tr>
                  );
                })}
                <tr className='paymentPage__main-table-total'>
                  <td>T???ng</td>
                  <td>
                    {state.data
                      .reduce((total, item) => {
                        return total + item.price * item.quantity;
                      }, 0)
                      .toLocaleString('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                      })}
                  </td>
                </tr>
              </tbody>
            </Table>
          </Col>
          <Col md='7' className='paymentPage__main-right'>
            <div className='paymentPage__main-title'>
              <span>2</span>
              Th??ng tin ?????t h??ng
            </div>
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={(values) => handleSubmit(values)}
            >
              {(formikProps) => {
                return (
                  <Form className='paymentPage__form'>
                    <FastField
                      type='text'
                      name='userName'
                      component={InputField}
                      label='H??? v?? t??n'
                      placeholder='H??? v?? t??n'
                    />
                    <FastField
                      type='email'
                      name='userEmail'
                      component={InputField}
                      label='Email'
                      placeholder='Email'
                    />
                    <FastField
                      type='text'
                      name='userPhone'
                      component={InputField}
                      label='S??? ??i???n tho???i'
                      placeholder='S??? ??i???n tho???i'
                    />
                    <FastField
                      type='text'
                      name='userAddress'
                      component={InputField}
                      label='?????a ch???'
                      placeholder='?????a ch???'
                    />
                    <Label>Phu??ng th???c thanh to??n</Label>
                    <FormGroup tag='fieldset'>
                      {dataRadio.map((item, index) => {
                        return (
                          <FormGroup key={index} check>
                            <Label check>
                              <Field name='paymentMethod'>
                                {({ field, form }) => (
                                  <input
                                    {...field}
                                    type='radio'
                                    value={item.value}
                                    checked={state.radio === item.value}
                                    onChange={(e) => {
                                      form.setFieldValue(
                                        field.name,
                                        e.target.value
                                      );

                                      setState((newState) => ({
                                        ...newState,
                                        radio: e.target.value,
                                      }));
                                    }}
                                  />
                                )}
                              </Field>
                              {item.title}
                            </Label>
                          </FormGroup>
                        );
                      })}
                    </FormGroup>
                    <Collapse isOpen={state.radio === 'transfer'}>
                      <Card>
                        <CardBody>
                          <strong>
                            L??U ??: CH??? CHUY???N KHO???N SAU KHI NH??N VI??N B??N H??NG
                            LI??N H??? ?????N B???N X??C NH???N ????N H??NG
                          </strong>
                          <br />
                          <span>
                            Ng??n h??ng Vietcombank
                            <br />
                            S??? TK : 1234567891011
                            <br />
                            Chi nh??nh: VCB PGD ?????i C???n
                            <br />
                            Ch??? TK: Nghi??m T??ng D????ng
                          </span>
                          {` `}
                        </CardBody>
                      </Card>
                    </Collapse>
                    <button
                      type='submit'
                      className='btn btn-primary paymentPage__form-submit'
                      style={{
                        display: state.radio === 'paypal' ? 'none' : 'block',
                      }}
                    >
                      Ho??n t???t ?????t h??ng
                    </button>
                    <div
                      className='paymentPage__main-paypal'
                      style={{
                        display: state.radio === 'paypal' ? 'block' : 'none',
                      }}
                    >
                      <Paypal
                        total={state.data.reduce((total, item) => {
                          return total + item.price * item.quantity;
                        }, 0)}
                        onSuccess={onSuccess}
                      />
                    </div>
                  </Form>
                );
              }}
            </Formik>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

PaymentPage.propTypes = {};

export default PaymentPage;
